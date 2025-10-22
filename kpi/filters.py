from django_filters import rest_framework as filters
from .models import Detection


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