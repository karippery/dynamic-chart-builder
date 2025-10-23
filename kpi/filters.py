from django_filters import rest_framework as filters
from .models import Detection
from django.db.models import Q
from django.utils.dateparse import parse_datetime

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
    """Parse ISO datetime string safely."""
    if dt and isinstance(dt, str):
        return parse_datetime(dt)
    return dt


# --------- Close Call Filters --------- #

def get_human_detections(from_time=None, to_time=None, zone=None):
    """Return queryset for human detections with optional filters."""
    from_time = parse_if_str(from_time)
    to_time = parse_if_str(to_time)

    filters = Q(object_class=Detection.ObjectClass.HUMAN)
    if from_time:
        filters &= Q(timestamp__gte=from_time)
    if to_time:
        filters &= Q(timestamp__lte=to_time)
    if zone:
        filters &= Q(zone=zone)

    return Detection.objects.filter(filters)


def get_vehicle_detections_in_range(start_time, end_time, zone=None, vehicle_class=None):
    """Return queryset for vehicle detections in a specific time range."""
    filters = Q(
        object_class__in=[
            Detection.ObjectClass.VEHICLE,
            Detection.ObjectClass.PALLET_TRUCK,
            Detection.ObjectClass.AGV,
        ],
        timestamp__range=(start_time, end_time),
    )

    if vehicle_class:
        filters &= Q(object_class=vehicle_class)
    if zone:
        filters &= Q(zone=zone)

    return Detection.objects.filter(filters)


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