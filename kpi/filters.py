from django_filters import rest_framework as filters
from .models import Detection
from django.db.models import Q
from django.utils import timezone
import datetime

class DetectionFilter(filters.FilterSet):
    """
    FilterSet for Detection model queries.
    
    Provides comprehensive filtering capabilities for detection data
    including time ranges, object classifications, spatial filters,
    and numeric ranges.
    """
    
    # Time range filters
    from_time = filters.IsoDateTimeFilter(field_name='timestamp', lookup_expr='gte')
    to_time = filters.IsoDateTimeFilter(field_name='timestamp', lookup_expr='lte')
    
    # Multiple selection filters
    object_class = filters.MultipleChoiceFilter(
        field_name='object_class',
        choices=Detection.ObjectClass.choices
    )
    zone = filters.CharFilter(field_name='zone', lookup_expr='iexact')
    vest = filters.BooleanFilter(field_name='vest')
    
    # Numeric range filters
    min_speed = filters.NumberFilter(field_name='speed', lookup_expr='gte')
    max_speed = filters.NumberFilter(field_name='speed', lookup_expr='lte')
    min_heading = filters.NumberFilter(field_name='heading', lookup_expr='gte')
    max_heading = filters.NumberFilter(field_name='heading', lookup_expr='lte')
    
    # Bounding box filter (simple rectangle)
    min_x = filters.NumberFilter(field_name='x', lookup_expr='gte')
    max_x = filters.NumberFilter(field_name='x', lookup_expr='lte')
    min_y = filters.NumberFilter(field_name='y', lookup_expr='gte')
    max_y = filters.NumberFilter(field_name='y', lookup_expr='lte')

    class Meta:
        """FilterSet metadata configuration."""
        model = Detection
        fields = [
            'object_class', 'zone', 'vest', 
            'min_speed', 'max_speed', 'min_heading', 'max_heading',
            'min_x', 'max_x', 'min_y', 'max_y'
        ]


def parse_if_str(dt):
    """Parse ISO datetime string safely with timezone support."""
    if dt is None:
        return None
    if isinstance(dt, str):
        try:
            # Handle ISO format with timezone
            if 'Z' in dt:
                dt = dt.replace('Z', '+00:00')
            parsed = datetime.datetime.fromisoformat(dt)
            
            # Make it timezone-aware if it's naive
            if parsed.tzinfo is None:
                parsed = timezone.make_aware(parsed, timezone.utc)
            
            return parsed
        except (ValueError, AttributeError) as e:
            print(f"DEBUG: Failed to parse datetime '{dt}': {e}")
            return None
    return dt


# --------- Close Call Filters --------- #

def get_human_detections(from_time=None, to_time=None, zone=None):
    """Return queryset for human detections with optional filters."""
    from_time = parse_if_str(from_time)
    to_time = parse_if_str(to_time)

    # DEBUG: Print what we're filtering for
    print(f"DEBUG get_human_detections: from_time={from_time}, to_time={to_time}, zone={zone}")

    queryset = Detection.objects.filter(object_class=Detection.ObjectClass.HUMAN)
    
    if from_time:
        queryset = queryset.filter(timestamp__gte=from_time)
    if to_time:
        queryset = queryset.filter(timestamp__lte=to_time)
    if zone:
        queryset = queryset.filter(zone=zone)

    # DEBUG: Print count
    count = queryset.count()
    print(f"DEBUG get_human_detections: found {count} human detections")
    
    return queryset


def get_vehicle_detections_in_range(start_time, end_time, zone=None, vehicle_class=None):
    """Return queryset for vehicle detections in a specific time range."""
    # DEBUG: Print what we're filtering for
    print(f"DEBUG get_vehicle_detections_in_range: start_time={start_time}, end_time={end_time}, zone={zone}, vehicle_class={vehicle_class}")

    queryset = Detection.objects.filter(
        object_class__in=[
            Detection.ObjectClass.VEHICLE,
            Detection.ObjectClass.PALLET_TRUCK,
            Detection.ObjectClass.AGV,
        ],
        timestamp__range=(start_time, end_time),
    )

    if vehicle_class:
        queryset = queryset.filter(object_class=vehicle_class)
    if zone:
        queryset = queryset.filter(zone=zone)

    # DEBUG: Print count
    count = queryset.count()
    print(f"DEBUG get_vehicle_detections_in_range: found {count} vehicle detections")
    
    return queryset

# --------- Safety Event Filters --------- #

def get_overspeed_detections(
    speed_threshold,
    from_time=None,
    to_time=None,
    zone=None,
    object_class=None,
    include_humans=False,
):
    """Return queryset for overspeed detections."""
    from_time = parse_if_str(from_time)
    to_time = parse_if_str(to_time)

    filters = Q(speed__gt=speed_threshold)

    if object_class:
        filters &= Q(object_class=object_class)
    elif not include_humans:
        filters &= Q(
            object_class__in=[
                Detection.ObjectClass.VEHICLE,
                Detection.ObjectClass.PALLET_TRUCK,
                Detection.ObjectClass.AGV,
            ]
        )

    if from_time:
        filters &= Q(timestamp__gte=from_time)
    if to_time:
        filters &= Q(timestamp__lte=to_time)
    if zone:
        filters &= Q(zone=zone)

    return Detection.objects.filter(filters)


def get_vest_violations(from_time=None, to_time=None, zone=None):
    """Return queryset for human detections without safety vest."""
    from_time = parse_if_str(from_time)
    to_time = parse_if_str(to_time)

    filters = Q(object_class=Detection.ObjectClass.HUMAN, vest=False)
    if from_time:
        filters &= Q(timestamp__gte=from_time)
    if to_time:
        filters &= Q(timestamp__lte=to_time)
    if zone:
        filters &= Q(zone=zone)

    return Detection.objects.filter(filters)

def derive_speed_for_object(object_id, from_time=None, to_time=None):
    """
    Calculate speed from position changes over time for a given object ID.
    This fulfills the "If speed is derived, compute per id" requirement.
    """
    # Get detections for this object in time range, ordered by timestamp
    detections = Detection.objects.filter(
        tracking_id=object_id
    )
    
    if from_time:
        from_time = parse_if_str(from_time)
        detections = detections.filter(timestamp__gte=from_time)
    if to_time:
        to_time = parse_if_str(to_time) 
        detections = detections.filter(timestamp__lte=to_time)
    
    detections = detections.order_by('timestamp')
    
    if detections.count() < 2:
        return 0.0  # Not enough points to calculate speed
    
    speeds = []
    for i in range(1, len(detections)):
        prev_det = detections[i-1]
        curr_det = detections[i]
        
        # Calculate time difference in seconds
        time_diff = (curr_det.timestamp - prev_det.timestamp).total_seconds()
        if time_diff <= 0:
            continue
        
        # Calculate Euclidean distance between consecutive points
        distance = ((curr_det.x - prev_det.x)**2 + (curr_det.y - prev_det.y)**2)**0.5
        
        # Speed in m/s
        speed = distance / time_diff
        speeds.append(speed)
    
    return sum(speeds) / len(speeds) if speeds else 0.0

def derive_speeds_bulk(object_ids, from_time=None, to_time=None):
    """
    Bulk calculate speeds for multiple objects efficiently.
    Returns dict of {object_id: average_speed}
    """
    if not object_ids:
        return {}
    
    # Get all detections for these objects in one query
    detections_qs = Detection.objects.filter(
        tracking_id__in=object_ids
    )
    
    if from_time:
        detections_qs = detections_qs.filter(timestamp__gte=from_time)
    if to_time:
        detections_qs = detections_qs.filter(timestamp__lte=to_time)
    
    # Order and prefetch
    detections_qs = detections_qs.order_by('tracking_id', 'timestamp')
    
    # Process in memory
    detections_list = list(detections_qs)
    
    speed_results = {}
    current_obj_id = None
    obj_speeds = []
    prev_detection = None
    
    for detection in detections_list:
        if detection.tracking_id != current_obj_id:
            # Process previous object
            if current_obj_id and obj_speeds:
                speed_results[current_obj_id] = sum(obj_speeds) / len(obj_speeds)
            elif current_obj_id:
                speed_results[current_obj_id] = 0.0
            
            # Reset for new object
            current_obj_id = detection.tracking_id
            obj_speeds = []
            prev_detection = detection
            continue
        
        # Calculate speed between consecutive detections
        time_diff = (detection.timestamp - prev_detection.timestamp).total_seconds()
        if time_diff > 0:
            distance = ((detection.x - prev_detection.x)**2 + (detection.y - prev_detection.y)**2)**0.5
            speed = distance / time_diff
            obj_speeds.append(speed)
        
        prev_detection = detection
    
    # Process last object
    if current_obj_id and obj_speeds:
        speed_results[current_obj_id] = sum(obj_speeds) / len(obj_speeds)
    elif current_obj_id:
        speed_results[current_obj_id] = 0.0
    
    return speed_results


def get_overspeed_detections_with_derived_speed(
    speed_threshold=1.5,
    from_time=None,
    to_time=None,
    zone=None,
    object_class=None,
    include_humans=False,
    max_objects=500  # Reasonable limit
):
    """
    Optimized version using bulk processing.
    """
    from_time = parse_if_str(from_time)
    to_time = parse_if_str(to_time)
    
    # Base filters
    base_filters = Q()
    if object_class:
        base_filters &= Q(object_class=object_class)
    elif not include_humans:
        base_filters &= Q(
            object_class__in=[
                Detection.ObjectClass.VEHICLE,
                Detection.ObjectClass.PALLET_TRUCK, 
                Detection.ObjectClass.AGV,
            ]
        )
    
    if from_time:
        base_filters &= Q(timestamp__gte=from_time)
    if to_time:
        base_filters &= Q(timestamp__lte=to_time)
    if zone:
        base_filters &= Q(zone=zone)
    
    # Step 1: Get direct overspeed detections
    direct_overspeed = Detection.objects.filter(
        base_filters & Q(speed__gt=speed_threshold)
    ).values_list('id', flat=True)
    
    # Step 2: Get limited set of objects without speed data
    objects_without_speed = Detection.objects.filter(
        base_filters & (Q(speed__isnull=True) | Q(speed=0))
    ).values_list('tracking_id', flat=True).distinct()[:max_objects]
    
    objects_without_speed = list(objects_without_speed)
    
    # Step 3: Bulk calculate speeds
    derived_speeds = derive_speeds_bulk(objects_without_speed, from_time, to_time)
    
    # Step 4: Find overspeeding objects
    overspeeding_objects = [
        obj_id for obj_id, speed in derived_speeds.items() 
        if speed > speed_threshold
    ]
    
    # Step 5: Get detection IDs for overspeeding objects
    if overspeeding_objects:
        derived_overspeed_ids = Detection.objects.filter(
            tracking_id__in=overspeeding_objects
        ).filter(base_filters).values_list('id', flat=True)
    else:
        derived_overspeed_ids = []
    
    # Step 6: Combine all IDs
    all_overspeed_ids = set(direct_overspeed) | set(derived_overspeed_ids)
    
    if not all_overspeed_ids:
        return Detection.objects.none()
    
    return Detection.objects.filter(id__in=all_overspeed_ids)

