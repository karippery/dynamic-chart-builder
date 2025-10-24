# your_app/management/commands/import_detections.py
import csv
import os
from django.core.management.base import BaseCommand
from django.utils.dateparse import parse_datetime
from django.conf import settings
from django.db import transaction
from kpi.models import Detection


class Command(BaseCommand):
    help = "Bulk import detection data from CSV (optimized for large files)"
    BATCH_SIZE = 5000

    def add_arguments(self, parser):
        parser.add_argument(
            '--csv-path',
            type=str,
            help='Custom path to CSV file',
        )

    def handle(self, *args, **options):
        # Use custom path or default path
        csv_path = options.get('csv_path') or os.path.join(settings.BASE_DIR, "csv_file", "work-package-raw-data.csv")

        self.stdout.write(f"Looking for CSV at: {csv_path}")
        
        if not os.path.exists(csv_path):
            self.stderr.write(self.style.ERROR(f"CSV file not found: {csv_path}"))
            self.stdout.write("Current directory contents:")
            for root, dirs, files in os.walk(settings.BASE_DIR):
                for file in files:
                    if file.endswith('.csv'):
                        self.stdout.write(f"Found CSV: {os.path.join(root, file)}")
            return

        file_size = os.path.getsize(csv_path)
        self.stdout.write(f"CSV file found. Size: {file_size} bytes")

        self.stdout.write(self.style.WARNING("Starting optimized bulk data migration from CSV to DB..."))

        batch = []
        imported_total = 0
        skipped_total = 0
        row_num = 0

        # Get current count for verification
        initial_count = Detection.objects.count()
        self.stdout.write(f"Initial records in database: {initial_count}")

        with open(csv_path, newline='', encoding='utf-8') as csvfile:
            reader = csv.DictReader(csvfile)
            
            for row in reader:
                row_num += 1

                # Progress indicator
                if row_num % 10000 == 0:
                    self.stdout.write(f"Processed {row_num} rows...")

                try:
                    # Validate object_class
                    obj_type = row["type"]
                    if obj_type not in Detection.ObjectClass.values:
                        self.stderr.write(
                            f"Row {row_num}: Invalid object_class '{obj_type}'"
                        )
                        skipped_total += 1
                        continue

                    # Parse vest
                    vest_val = row["vest"]
                    vest = None
                    if vest_val in ("0", "1"):
                        vest = (vest_val == "1")

                    # Parse timestamp
                    timestamp = parse_datetime(row["timestamp"])
                    if timestamp is None:
                        self.stderr.write(f"Row {row_num}: Invalid timestamp → skipping")
                        skipped_total += 1
                        continue

                    # Build Detection instance
                    detection = Detection(
                        tracking_id=row["id"],
                        object_class=obj_type,
                        timestamp=timestamp,
                        x=float(row["x"]),
                        y=float(row["y"]),
                        heading=float(row["heading"]) if row["heading"] not in ("", None) else None,
                        speed=float(row["speed"]) if row["speed"] not in ("", None) else None,
                        zone=row["area"] or None,
                        vest=vest,
                    )
                    batch.append(detection)

                except (ValueError, KeyError, TypeError) as e:
                    self.stderr.write(f"Row {row_num}: Skipped due to error: {e}")
                    skipped_total += 1
                    continue

                # Flush batch
                if len(batch) >= self.BATCH_SIZE:
                    imported_batch = self._bulk_insert(batch)
                    imported_total += imported_batch
                    self.stdout.write(f"Inserted batch of {imported_batch} records")
                    batch = []

            # Final batch
            if batch:
                imported_batch = self._bulk_insert(batch)
                imported_total += imported_batch
                self.stdout.write(f"Inserted final batch of {imported_batch} records")

        # Final verification
        final_count = Detection.objects.count()
        actual_inserted = final_count - initial_count

        self.stdout.write(
            self.style.SUCCESS(
                f"Bulk import completed!\n"
                f"   • Rows processed: {row_num}\n"
                f"   • Batch reported inserted: {imported_total}\n"
                f"   • Actually inserted (DB count): {actual_inserted}\n"
                f"   • Skipped (errors): {skipped_total}\n"
                f"   • Initial count: {initial_count}\n"
                f"   • Final count: {final_count}"
            )
        )

    def _bulk_insert(self, batch):
        try:
            with transaction.atomic():
                created = Detection.objects.bulk_create(
                    batch,
                    batch_size=self.BATCH_SIZE
                )
                return len(created)
        except Exception as e:
            self.stderr.write(self.style.ERROR(f"Bulk insert failed: {e}"))
            # Try individual inserts to identify problematic records
            success_count = 0
            for i, detection in enumerate(batch):
                try:
                    detection.save()
                    success_count += 1
                except Exception as indv_error:
                    self.stderr.write(f"Individual insert failed for record {i}: {indv_error}")
            return success_count