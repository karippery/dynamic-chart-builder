import random
from datetime import datetime, timedelta
from django.core.management.base import BaseCommand
from django.utils import timezone
from kpi.models import Detection

class Command(BaseCommand):
    help = 'Generate fake detection data for close call testing'

    def add_arguments(self, parser):
        parser.add_argument(
            '--count',
            type=int,
            default=1000,
            help='Number of detection records to create (default: 1000)'
        )
        parser.add_argument(
            '--days',
            type=int,
            default=1,  # Changed to 1 day for better temporal clustering
            help='Number of days to spread data over (default: 1)'
        )
        parser.add_argument(
            '--clear',
            action='store_true',
            help='Clear existing detection data before generating new data'
        )

    def handle(self, *args, **options):
        count = options['count']
        days = options['days']
        clear = options['clear']

        if clear:
            self.stdout.write('Clearing existing detection data...')
            Detection.objects.all().delete()
            self.stdout.write(
                self.style.SUCCESS('Successfully cleared detection data')
            )

        self.stdout.write(f'Generating {count} fake detection records...')

        # Zones for realistic distribution
        zones = ['1', '2', '9', '12', '15', '20', '25']
        
        # Tracking IDs for continuity
        human_tracking_ids = [f"human_{i:03d}" for i in range(1, 21)]  # 20 humans
        vehicle_tracking_ids = [f"vehicle_{i:03d}" for i in range(1, 16)]  # 15 vehicles
        pallet_truck_ids = [f"pallet_{i:03d}" for i in range(1, 11)]  # 10 pallet trucks
        agv_ids = [f"agv_{i:03d}" for i in range(1, 6)]  # 5 AGVs

        # Create specific close call hotspots with smaller ranges
        close_call_hotspots = {
            '12': [
                {'x_range': (2, 8), 'y_range': (17, 23)},  # Main interaction area
                {'x_range': (10, 15), 'y_range': (18, 22)}, # Secondary area
            ],
            '9': [
                {'x_range': (12, 18), 'y_range': (16, 24)},
            ],
            '1': [
                {'x_range': (12, 14), 'y_range': (145, 148)},
            ]
        }

        detections = []
        base_time = timezone.now() - timedelta(days=days)
        
        # Create guaranteed close call scenarios first
        guaranteed_close_calls_count = min(100, count // 10)  # 10% of total or 100, whichever is smaller
        self.create_guaranteed_close_calls(detections, base_time, guaranteed_close_calls_count)
        
        remaining_count = count - guaranteed_close_calls_count

        for i in range(remaining_count):
            # Determine object type with realistic distribution
            obj_type_roll = random.random()
            if obj_type_roll < 0.4:  # 40% humans
                object_class = Detection.ObjectClass.HUMAN
                tracking_id = random.choice(human_tracking_ids)
                vest = random.choice([True, True, True, False])  # 75% wear vests
                speed = round(random.uniform(0, 2.5), 2)
            elif obj_type_roll < 0.7:  # 30% vehicles
                object_class = Detection.ObjectClass.VEHICLE
                tracking_id = random.choice(vehicle_tracking_ids)
                vest = None
                speed = round(random.uniform(0, 1.5), 2)
            elif obj_type_roll < 0.9:  # 20% pallet trucks
                object_class = Detection.ObjectClass.PALLET_TRUCK
                tracking_id = random.choice(pallet_truck_ids)
                vest = None
                speed = round(random.uniform(0, 1.2), 2)
            else:  # 10% AGVs
                object_class = Detection.ObjectClass.AGV
                tracking_id = random.choice(agv_ids)
                vest = None
                speed = round(random.uniform(0.5, 2.0), 2)

            # Choose zone - bias towards zones where close calls happen
            zone_roll = random.random()
            if zone_roll < 0.7:  # 70% in close call zones (increased from 60%)
                zone = random.choice(list(close_call_hotspots.keys()))
                # Choose a specific hotspot within the zone
                hotspot = random.choice(close_call_hotspots[zone])
                x = round(random.uniform(hotspot['x_range'][0], hotspot['x_range'][1]), 2)
                y = round(random.uniform(hotspot['y_range'][0], hotspot['y_range'][1]), 2)
            else:  # 30% in other zones
                zone = random.choice([z for z in zones if z not in close_call_hotspots])
                x = round(random.uniform(0, 30), 2)
                y = round(random.uniform(0, 160), 2)

            # Create timestamp - use smaller time window for better clustering
            time_offset = random.uniform(0, days * 24 * 60 * 60)  # seconds
            timestamp = base_time + timedelta(seconds=time_offset)

            # Increase temporal clustering probability
            if random.random() < 0.3:  # 30% chance (increased from 10%)
                # Cluster within 2-second windows for better close call chances
                cluster_base = base_time + timedelta(seconds=random.uniform(0, days * 24 * 60 * 60))
                timestamp = cluster_base + timedelta(seconds=random.uniform(-1, 1))

            # Create detection
            detection = Detection(
                tracking_id=tracking_id,
                object_class=object_class,
                timestamp=timestamp,
                x=x,
                y=y,
                heading=round(random.uniform(0, 360), 2) if random.random() > 0.2 else None,
                vest=vest,
                speed=speed,
                zone=zone
            )
            detections.append(detection)

            # Progress indicator
            if i % 100 == 0:
                self.stdout.write(f'Created {i + guaranteed_close_calls_count}/{count} records...')

        # Bulk create all detections
        Detection.objects.bulk_create(detections)

        self.stdout.write(
            self.style.SUCCESS(
                f'Successfully created {count} fake detection records ({guaranteed_close_calls_count} guaranteed close calls)'
            )
        )

        # Print some statistics
        total_detections = Detection.objects.count()
        human_count = Detection.objects.filter(object_class='human').count()
        vehicle_count = Detection.objects.filter(object_class='vehicle').count()
        pallet_count = Detection.objects.filter(object_class='pallet_truck').count()
        agv_count = Detection.objects.filter(object_class='agv').count()

        self.stdout.write(f'\nDatabase Statistics:')
        self.stdout.write(f'Total detections: {total_detections}')
        self.stdout.write(f'Humans: {human_count}')
        self.stdout.write(f'Vehicles: {vehicle_count}')
        self.stdout.write(f'Pallet trucks: {pallet_count}')
        self.stdout.write(f'AGVs: {agv_count}')

        # Test close call detection
        self.stdout.write(f'\nTesting close call detection...')
        self.test_close_calls()

    def create_guaranteed_close_calls(self, detections, base_time, count):
        """Create detection pairs that guarantee close calls"""
        self.stdout.write(f'Creating {count} guaranteed close call scenarios...')
        
        human_ids = [f"human_{i:03d}" for i in range(1, 11)]
        vehicle_ids = [f"vehicle_{i:03d}" for i in range(1, 8)]
        pallet_ids = [f"pallet_{i:03d}" for i in range(1, 6)]
        agv_ids = [f"agv_{i:03d}" for i in range(1, 4)]
        
        close_call_scenarios = [
            # (zone, human_x_range, human_y_range, vehicle_x_offset, vehicle_y_offset)
            ('12', (3, 7), (18, 20), 0.5, 0.0),   # Parallel movement, 0.5m apart
            ('12', (4, 8), (19, 21), 1.2, 0.0),   # Parallel movement, 1.2m apart
            ('9', (13, 16), (17, 19), 0.0, 0.8),  # Perpendicular, 0.8m apart
            ('1', (12.5, 13.5), (146, 147), 0.7, 0.7), # Diagonal, ~1.0m apart
        ]
        
        for i in range(count):
            scenario = random.choice(close_call_scenarios)
            zone, hx_range, hy_range, vx_offset, vy_offset = scenario
            
            # Choose random but close positions
            human_x = round(random.uniform(hx_range[0], hx_range[1]), 2)
            human_y = round(random.uniform(hy_range[0], hy_range[1]), 2)
            
            # Vehicle position is offset from human position
            vehicle_x = human_x + vx_offset
            vehicle_y = human_y + vy_offset
            
            # Timestamp - ensure they're within 250ms
            time_offset = random.uniform(0, 24 * 60 * 60)  # Within 1 day
            base_timestamp = base_time + timedelta(seconds=time_offset)
            
            human_timestamp = base_timestamp
            vehicle_timestamp = base_timestamp + timedelta(milliseconds=random.randint(50, 200))
            
            # Choose human and vehicle
            human_id = random.choice(human_ids)
            vehicle_type_roll = random.random()
            if vehicle_type_roll < 0.5:
                vehicle_class = Detection.ObjectClass.VEHICLE
                vehicle_id = random.choice(vehicle_ids)
            elif vehicle_type_roll < 0.8:
                vehicle_class = Detection.ObjectClass.PALLET_TRUCK
                vehicle_id = random.choice(pallet_ids)
            else:
                vehicle_class = Detection.ObjectClass.AGV
                vehicle_id = random.choice(agv_ids)
            
            # Create human detection
            human_detection = Detection(
                tracking_id=human_id,
                object_class=Detection.ObjectClass.HUMAN,
                timestamp=human_timestamp,
                x=human_x,
                y=human_y,
                vest=random.choice([True, True, True, False]),
                speed=round(random.uniform(0.5, 1.5), 2),
                zone=zone,
                heading=round(random.uniform(0, 360), 2) if random.random() > 0.3 else None,
            )
            detections.append(human_detection)
            
            # Create vehicle detection
            vehicle_detection = Detection(
                tracking_id=vehicle_id,
                object_class=vehicle_class,
                timestamp=vehicle_timestamp,
                x=vehicle_x,
                y=vehicle_y,
                speed=round(random.uniform(0.3, 1.2), 2),
                zone=zone,
                heading=round(random.uniform(0, 360), 2) if random.random() > 0.3 else None,
            )
            detections.append(vehicle_detection)
            
            if i % 20 == 0:
                self.stdout.write(f'  Created {i}/{count} guaranteed close calls...')

    def test_close_calls(self):
        """Test if close calls can be detected with the generated data"""
        from kpi.services.close_call_service import CloseCallKPI
        
        # Test with different parameters
        test_cases = [
            {'distance_threshold': 2.0, 'time_window_ms': 250},
            {'distance_threshold': 1.5, 'time_window_ms': 250},
            {'zone': '12', 'distance_threshold': 2.0, 'time_window_ms': 250},
            {'zone': '9', 'distance_threshold': 2.0, 'time_window_ms': 250},
            {'distance_threshold': 3.0, 'time_window_ms': 500},
        ]
        
        for i, params in enumerate(test_cases, 1):
            self.stdout.write(f'\nTest case {i}: {params}')
            try:
                kpi_computer = CloseCallKPI(**params)
                results = kpi_computer.compute_close_calls()
                
                self.stdout.write(f'  Close calls detected: {results["total_count"]}')
                self.stdout.write(f'  Humans processed: {results["statistics"]["human_detections_processed"]}')
                self.stdout.write(f'  Vehicles processed: {results["statistics"]["vehicle_detections_processed"]}')
                
                if results["total_count"] > 0:
                    self.stdout.write(
                        self.style.SUCCESS('  ✓ Close calls successfully detected!')
                    )
                    # Show breakdown
                    self.stdout.write(f'  By severity: {results["by_severity"]}')
                    self.stdout.write(f'  By vehicle class: {results["by_vehicle_class"]}')
                else:
                    self.stdout.write(
                        self.style.WARNING('  ⚠ No close calls detected with these parameters')
                    )
                    # Debug info
                    total_humans = Detection.objects.filter(object_class='human').count()
                    total_vehicles = Detection.objects.filter(
                        object_class__in=['vehicle', 'pallet_truck', 'agv']
                    ).count()
                    self.stdout.write(f'  DEBUG: Total humans in DB: {total_humans}')
                    self.stdout.write(f'  DEBUG: Total vehicles in DB: {total_vehicles}')
                    
            except Exception as e:
                self.stdout.write(
                    self.style.ERROR(f'  ✗ Error in close call detection: {e}')
                )