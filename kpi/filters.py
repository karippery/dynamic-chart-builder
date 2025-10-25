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


def get_overspeed_detections_with_derived_speed(
    speed_threshold=1.5,
    from_time=None,
    to_time=None,
    zone=None,
    object_class=None,
    include_humans=False
):
    """
    MORE EFFICIENT version - avoids union and handles annotations properly.
    """
    from_time = parse_if_str(from_time)
    to_time = parse_if_str(to_time)
    
    # Start with direct speed violations
    qs = get_overspeed_detections(
        speed_threshold, from_time, to_time, zone, object_class, include_humans
    )
    
    # Get IDs of direct overspeed detections
    direct_overspeed_ids = set(qs.values_list('id', flat=True))
    
    # Find objects that don't have speed data but might be overspeeding
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
    
    # Get unique objects without speed data
    objects_without_speed = Detection.objects.filter(
        base_filters & (Q(speed__isnull=True) | Q(speed=0))
    ).values_list('tracking_id', flat=True).distinct()
    
    # Check derived speeds and collect IDs
    derived_overspeed_ids = set()
    for obj_id in objects_without_speed:
        derived_speed = derive_speed_for_object(obj_id, from_time, to_time)
        if derived_speed > speed_threshold:
            # Get detection IDs for this overspeeding object
            obj_detection_ids = Detection.objects.filter(
                tracking_id=obj_id
            )
            if from_time:
                obj_detection_ids = obj_detection_ids.filter(timestamp__gte=from_time)
            if to_time:
                obj_detection_ids = obj_detection_ids.filter(timestamp__lte=to_time)
            if zone:
                obj_detection_ids = obj_detection_ids.filter(zone=zone)
            
            derived_overspeed_ids.update(obj_detection_ids.values_list('id', flat=True))
    
    # Combine all IDs
    all_overspeed_ids = direct_overspeed_ids.union(derived_overspeed_ids)
    
    if not all_overspeed_ids:
        return Detection.objects.none()
    
    # Return a clean queryset that supports annotations
    return Detection.objects.filter(id__in=all_overspeed_ids)