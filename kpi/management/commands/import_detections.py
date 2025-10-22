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
    BATCH_SIZE = 5000  # Adjust based on available RAM

    def handle(self, *args, **options):
        csv_path = os.path.join(settings.BASE_DIR, "csv_file", "work-package-raw-data.csv")

        if not os.path.exists(csv_path):
            self.stderr.write(self.style.ERROR(f"CSV file not found: {csv_path}"))
            return

        self.stdout.write(self.style.WARNING("Starting optimized bulk data migration from CSV to DB..."))

        batch = []
        imported_total = 0
        skipped_total = 0
        row_num = 1  # Will increment inside loop

        with open(csv_path, newline='', encoding='utf-8') as csvfile:
            reader = csv.DictReader(csvfile)
            for row in reader:
                row_num += 1

                try:
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

                    # Build Detection object (no DB hit yet)
                    detection = Detection(
                        tracking_id=row["id"],
                        object_class=row["type"],
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

                # Flush batch when full
                if len(batch) >= self.BATCH_SIZE:
                    imported_total += self._bulk_insert(batch)
                    batch = []

            # Insert remaining
            if batch:
                imported_total += self._bulk_insert(batch)

        self.stdout.write(
            self.style.SUCCESS(
                f"Bulk import completed!\n"
                f"   • Successfully inserted: {imported_total}\n"
                f"   • Skipped (errors/duplicates): {skipped_total}"
            )
        )

    def _bulk_insert(self, batch):
        """Insert a batch using bulk_create with conflict handling."""
        try:
            # ignore_conflicts=True skips rows that violate unique constraints
            created = Detection.objects.bulk_create(
                batch,
                ignore_conflicts=True,
                batch_size=self.BATCH_SIZE
            )
            return len(created)
        except Exception as e:
            self.stderr.write(self.style.ERROR(f"Bulk insert failed: {e}"))
            # Optionally: fall back to row-by-row for this batch (not shown for brevity)
            return 0