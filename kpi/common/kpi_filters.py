# kpi/common/kpi_filters.py
from datetime import datetime, timedelta
from typing import Optional
from django.utils import timezone
from django.db.models import Q
from django.db.models import Count, Min, Max, Avg

from kpi.models import Detection


def parse_if_str(timestamp) -> Optional[timezone.datetime]:
    """
    Parse timestamp if it's a string, return as timezone-aware datetime
    """
    if timestamp is None:
        return None
    
    if isinstance(timestamp, str):
        try:
            # Try ISO format first
            parsed = timezone.datetime.fromisoformat(timestamp.replace('Z', '+00:00'))
        except ValueError:
            # Try other common formats
            for fmt in ['%Y-%m-%d %H:%M:%S', '%Y-%m-%dT%H:%M:%S', '%Y-%m-%d']:
                try:
                    parsed = datetime.strptime(timestamp, fmt)
                    break
                except ValueError:
                    continue
            else:
                raise ValueError(f"Unable to parse timestamp: {timestamp}")
        
        # Make timezone aware if naive
        if parsed.tzinfo is None:
            parsed = timezone.make_aware(parsed)
        
        return parsed
    
    return timestamp


def get_human_detections(
    from_time: Optional[timezone.datetime] = None,
    to_time: Optional[timezone.datetime] = None,
    zone: Optional[str] = None
):
    """
    Get human detections with optional filtering
    """
    queryset = Detection.objects.filter(object_class='human')
    
    # Apply time filters
    if from_time:
        queryset = queryset.filter(timestamp__gte=from_time)
    if to_time:
        queryset = queryset.filter(timestamp__lte=to_time)
    
    # Apply zone filter
    if zone:
        queryset = queryset.filter(zone=zone)
    
    return queryset


def get_vehicle_detections(
    from_time: Optional[timezone.datetime] = None,
    to_time: Optional[timezone.datetime] = None,
    zone: Optional[str] = None,
    vehicle_class: Optional[str] = None
):
    """
    Get vehicle detections with optional filtering
    """
    queryset = Detection.objects.filter(
        object_class__in=['vehicle', 'pallet_truck', 'agv']
    )
    
    # Apply time filters
    if from_time:
        queryset = queryset.filter(timestamp__gte=from_time)
    if to_time:
        queryset = queryset.filter(timestamp__lte=to_time)
    
    # Apply zone filter
    if zone:
        queryset = queryset.filter(zone=zone)
    
    # Apply vehicle class filter
    if vehicle_class:
        queryset = queryset.filter(object_class=vehicle_class)
    
    return queryset


def get_vehicle_detections_in_range(
    min_time: timezone.datetime,
    max_time: timezone.datetime,
    zone: Optional[str] = None,
    vehicle_class: Optional[str] = None
):
    """
    Get vehicle detections within a specific time range
    Used for close-call detection with expanded time window
    """
    queryset = Detection.objects.filter(
        object_class__in=['vehicle', 'pallet_truck', 'agv'],
        timestamp__gte=min_time,
        timestamp__lte=max_time
    )
    
    # Apply zone filter
    if zone:
        queryset = queryset.filter(zone=zone)
    
    # Apply vehicle class filter
    if vehicle_class:
        queryset = queryset.filter(object_class=vehicle_class)
    
    return queryset


def get_detections_by_class(
    object_classes: list,
    from_time: Optional[timezone.datetime] = None,
    to_time: Optional[timezone.datetime] = None,
    zone: Optional[str] = None
):
    """
    Get detections by specific object classes
    """
    queryset = Detection.objects.filter(object_class__in=object_classes)
    
    if from_time:
        queryset = queryset.filter(timestamp__gte=from_time)
    if to_time:
        queryset = queryset.filter(timestamp__lte=to_time)
    if zone:
        queryset = queryset.filter(zone=zone)
    
    return queryset


def get_zone_detection_counts(
    from_time: Optional[timezone.datetime] = None,
    to_time: Optional[timezone.datetime] = None
):
    """
    Get detection counts grouped by zone
    """
    queryset = Detection.objects.all()
    
    if from_time:
        queryset = queryset.filter(timestamp__gte=from_time)
    if to_time:
        queryset = queryset.filter(timestamp__lte=to_time)
    
    return queryset.values('zone').annotate(
        total_detections=Count('id'),
        humans=Count('id', filter=Q(object_class='human')),
        vehicles=Count('id', filter=Q(object_class__in=['vehicle', 'pallet_truck', 'agv']))
    ).order_by('-total_detections')


def get_time_bucketed_detections(
    bucket_size: str = 'hour',
    from_time: Optional[timezone.datetime] = None,
    to_time: Optional[timezone.datetime] = None,
    zone: Optional[str] = None
):
    """
    Get detections grouped by time buckets
    """
    from django.db.models.functions import Trunc
    
    queryset = Detection.objects.all()
    
    if from_time:
        queryset = queryset.filter(timestamp__gte=from_time)
    if to_time:
        queryset = queryset.filter(timestamp__lte=to_time)
    if zone:
        queryset = queryset.filter(zone=zone)
    
    # Map bucket sizes to truncation parameters
    trunc_map = {
        'minute': 'minute',
        'hour': 'hour',
        'day': 'day',
        'week': 'week'
    }
    
    trunc_param = trunc_map.get(bucket_size, 'hour')
    
    return queryset.annotate(
        time_bucket=Trunc('timestamp', trunc_param)
    ).values('time_bucket').annotate(
        total_detections=Count('id'),
        humans=Count('id', filter=Q(object_class='human')),
        vehicles=Count('id', filter=Q(object_class__in=['vehicle', 'pallet_truck', 'agv']))
    ).order_by('time_bucket')


def get_repeat_offenders(
    from_time: Optional[timezone.datetime] = None,
    to_time: Optional[timezone.datetime] = None,
    min_incidents: int = 3,
    object_class: Optional[str] = None
):
    """
    Get tracking IDs with high incident counts (potential repeat offenders)
    """
    queryset = Detection.objects.all()
    
    if from_time:
        queryset = queryset.filter(timestamp__gte=from_time)
    if to_time:
        queryset = queryset.filter(timestamp__lte=to_time)
    if object_class:
        queryset = queryset.filter(object_class=object_class)
    
    return queryset.values('tracking_id').annotate(
        incident_count=Count('id'),
        first_seen=Min('timestamp'),
        last_seen=Max('timestamp'),
        zones=Count('zone', distinct=True)
    ).filter(
        incident_count__gte=min_incidents
    ).order_by('-incident_count')


def get_detection_statistics(
    from_time: Optional[timezone.datetime] = None,
    to_time: Optional[timezone.datetime] = None,
    zone: Optional[str] = None
):
    """
    Get comprehensive detection statistics
    """
    queryset = Detection.objects.all()
    
    if from_time:
        queryset = queryset.filter(timestamp__gte=from_time)
    if to_time:
        queryset = queryset.filter(timestamp__lte=to_time)
    if zone:
        queryset = queryset.filter(zone=zone)
    
    stats = queryset.aggregate(
        total_detections=Count('id'),
        unique_tracking_ids=Count('tracking_id', distinct=True),
        humans=Count('id', filter=Q(object_class='human')),
        vehicles=Count('id', filter=Q(object_class__in=['vehicle', 'pallet_truck', 'agv'])),
        pallet_trucks=Count('id', filter=Q(object_class='pallet_truck')),
        agvs=Count('id', filter=Q(object_class='agv')),
        avg_speed=Avg('speed'),
        min_timestamp=Min('timestamp'),
        max_timestamp=Max('timestamp'),
        unique_zones=Count('zone', distinct=True)
    )
    
    # Calculate time span in minutes
    if stats['min_timestamp'] and stats['max_timestamp']:
        time_span = stats['max_timestamp'] - stats['min_timestamp']
        stats['time_span_minutes'] = time_span.total_seconds() / 60
    else:
        stats['time_span_minutes'] = 0
    
    return stats


# Default time range helpers
def get_default_time_range(hours: int = 24):
    """
    Get default time range for KPI calculations
    """
    to_time = timezone.now()
    from_time = to_time - timedelta(hours=hours)
    return from_time, to_time


def get_shift_time_range(shift: str = 'current'):
    """
    Get time range for specific shifts
    """
    now = timezone.now()
    
    shift_ranges = {
        'morning': (6, 14),    # 6 AM - 2 PM
        'afternoon': (14, 22), # 2 PM - 10 PM  
        'night': (22, 6),      # 10 PM - 6 AM
    }
    
    if shift == 'current':
        current_hour = now.hour
        for shift_name, (start, end) in shift_ranges.items():
            if start <= current_hour < end:
                shift = shift_name
                break
        else:
            shift = 'night'  # Default to night shift
    
    start_hour, end_hour = shift_ranges.get(shift, (0, 24))
    
    if start_hour < end_hour:
        from_time = now.replace(hour=start_hour, minute=0, second=0, microsecond=0)
        to_time = now.replace(hour=end_hour, minute=0, second=0, microsecond=0)
    else:
        # Overnight shift
        from_time = now.replace(hour=start_hour, minute=0, second=0, microsecond=0)
        to_time = (now + timedelta(days=1)).replace(hour=end_hour, minute=0, second=0, microsecond=0)
    
    return from_time, to_time