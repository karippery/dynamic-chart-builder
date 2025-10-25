from rest_framework import serializers
from kpi.models import Detection


class CloseCallDetectionRequestSerializer(serializers.Serializer):
    """
    Serializer for validating close-call detection parameters.
    """
    distance_threshold = serializers.FloatField(
        default=2.0, 
        min_value=0.1,
        help_text="Maximum distance in meters to consider as close call"
    )
    time_window_ms = serializers.IntegerField(
        default=250,
        min_value=50,
        max_value=5000,
        help_text="Time synchronization window in milliseconds (±value)"
    )
    from_time = serializers.DateTimeField(
        required=False,
        help_text="Start time for detection period"
    )
    to_time = serializers.DateTimeField(
        required=False,
        help_text="End time for detection period"
    )
    zone = serializers.CharField(
        required=False,
        help_text="Filter by specific zone"
    )
    object_class = serializers.ChoiceField(
        choices=Detection.ObjectClass.choices,
        required=False,
        help_text="Filter by specific vehicle class"
    )
    include_details = serializers.BooleanField(
        default=True,
        help_text="Whether to include individual close call details in response"
    )
    # Add pagination parameters
    page = serializers.IntegerField(
        default=1,
        min_value=1,
        required=False,
        help_text="Page number for pagination"
    )
    page_size = serializers.IntegerField(
        default=10,
        min_value=1,
        max_value=100,
        required=False,
        help_text="Number of items per page"
    )

    def validate_distance_threshold(self, value):
        """Validate distance threshold."""
        if value <= 0:
            raise serializers.ValidationError("Distance threshold must be positive")
        return value

    def validate_time_window_ms(self, value):
        """Validate time window."""
        if value < 50:
            raise serializers.ValidationError("Time window must be at least 50ms")
        return value

    def validate_page(self, value):
        """Validate page number."""
        if value < 1:
            raise serializers.ValidationError("Page number must be at least 1")
        return value

    def validate_page_size(self, value):
        """Validate page size."""
        if value < 1:
            raise serializers.ValidationError("Page size must be at least 1")
        if value > 100:
            raise serializers.ValidationError("Page size cannot exceed 100")
        return value

class CloseCallDetailSerializer(serializers.Serializer):
    """Serializer for individual close call details."""
    timestamp = serializers.CharField()  # Changed to CharField for ISO format
    human_tracking_id = serializers.CharField()
    human_x = serializers.FloatField()
    human_y = serializers.FloatField()
    human_zone = serializers.CharField(allow_null=True)
    vehicle_tracking_id = serializers.CharField()
    vehicle_class = serializers.CharField()
    vehicle_x = serializers.FloatField()
    vehicle_y = serializers.FloatField()
    vehicle_zone = serializers.CharField(allow_null=True)
    distance = serializers.FloatField()
    distance_threshold = serializers.FloatField()
    time_window_ms = serializers.IntegerField()
    time_difference_ms = serializers.FloatField()
    severity = serializers.CharField()


class CloseCallKPIResponseSerializer(serializers.Serializer):
    """
    Serializer for close-call KPI computation response.
    """
    total_count = serializers.IntegerField(help_text="Total number of close calls detected")
    parameters_used = serializers.DictField(
        help_text="Parameters used for computation",
        required=False
    )
    by_vehicle_class = serializers.DictField(help_text="Close calls grouped by vehicle class")
    by_severity = serializers.DictField(help_text="Close calls grouped by severity level")
    time_series = serializers.ListField(
        child=serializers.DictField(),
        help_text="Close calls aggregated by time",
        required=False
    )
    close_calls = CloseCallDetailSerializer(
        many=True, 
        required=False,
        help_text="Detailed close call information"
    )
    statistics = serializers.DictField(help_text="Computation statistics")
    computed_at = serializers.DateTimeField(
        help_text="When the computation was performed",
        required=False
    )
    include_details = serializers.BooleanField(
        help_text="Whether details are included",
        required=False
    )
    # Add pagination metadata
    pagination = serializers.DictField(
        help_text="Pagination information for close_calls and time_series",
        required=False
    )

    def to_representation(self, instance):
        """Custom representation to handle flexible data structure."""
        data = super().to_representation(instance)
        
        # Remove close_calls details if not requested
        if not instance.get('include_details', True):
            data.pop('close_calls', None)
            
        return data

from rest_framework import serializers
from kpi.common.pagination import DefaultPagination


class OverspeedEventRequestSerializer(serializers.Serializer):
    """
    Serializer for validating overspeed event parameters.
    """
    from_time = serializers.DateTimeField(
        required=False,
        help_text="Start time for detection period"
    )
    to_time = serializers.DateTimeField(
        required=False,
        help_text="End time for detection period"
    )
    zone = serializers.CharField(
        required=False,
        help_text="Filter by specific zone"
    )
    speed_threshold = serializers.FloatField(
        default=1.5,
        min_value=0.1,
        help_text="Speed threshold in m/s to consider as overspeed"
    )
    include_humans = serializers.BooleanField(
        default=False,
        help_text="Include humans in overspeed monitoring"
    )
    object_class = serializers.ChoiceField(
        choices=[('VEHICLE', 'Vehicle'), ('PALLET_TRUCK', 'Pallet Truck'), ('AGV', 'AGV'), ('HUMAN', 'Human')],
        required=False,
        help_text="Filter by specific object class"
    )
    # Pagination parameters
    page = serializers.IntegerField(
        default=1,
        min_value=1,
        required=False,
        help_text="Page number for pagination"
    )
    page_size = serializers.IntegerField(
        default=10,
        min_value=1,
        max_value=100,
        required=False,
        help_text="Number of items per page"
    )


class VestViolationRequestSerializer(serializers.Serializer):
    """
    Serializer for validating vest violation parameters.
    """
    from_time = serializers.DateTimeField(
        required=False,
        help_text="Start time for detection period"
    )
    to_time = serializers.DateTimeField(
        required=False,
        help_text="End time for detection period"
    )
    zone = serializers.CharField(
        required=False,
        help_text="Filter by specific zone"
    )
    # Pagination parameters
    page = serializers.IntegerField(
        default=1,
        min_value=1,
        required=False,
        help_text="Page number for pagination"
    )
    page_size = serializers.IntegerField(
        default=10,
        min_value=1,
        max_value=100,
        required=False,
        help_text="Number of items per page"
    )


class OverspeedEventDetailSerializer(serializers.Serializer):
    """Serializer for individual overspeed event details."""
    id = serializers.IntegerField()
    timestamp = serializers.DateTimeField()
    tracking_id = serializers.CharField()
    object_class = serializers.CharField()
    speed = serializers.FloatField(allow_null=True)
    derived_speed = serializers.FloatField(allow_null=True)
    x = serializers.FloatField()
    y = serializers.FloatField()
    zone = serializers.CharField(allow_null=True)
    speed_threshold = serializers.FloatField()


class VestViolationDetailSerializer(serializers.Serializer):
    """Serializer for individual vest violation details."""
    id = serializers.IntegerField()
    timestamp = serializers.DateTimeField()
    tracking_id = serializers.CharField()
    x = serializers.FloatField()
    y = serializers.FloatField()
    zone = serializers.CharField(allow_null=True)


class OverspeedEventsResponseSerializer(serializers.Serializer):
    """
    Serializer for overspeed events response.
    """
    total_count = serializers.IntegerField(help_text="Total number of overspeed events")
    speed_threshold = serializers.FloatField(help_text="Speed threshold used")
    parameters_used = serializers.DictField(help_text="Parameters used for computation")
    by_object_class = serializers.ListField(
        child=serializers.DictField(),
        help_text="Overspeed events grouped by object class"
    )
    statistics = serializers.DictField(help_text="Computation statistics")
    overspeed_events = OverspeedEventDetailSerializer(
        many=True,
        required=False,
        help_text="Detailed overspeed event information"
    )
    computed_at = serializers.DateTimeField(
        help_text="When the computation was performed",
        required=False
    )
    # Pagination metadata
    pagination = serializers.DictField(
        help_text="Pagination information for overspeed_events",
        required=False
    )


class VestViolationsResponseSerializer(serializers.Serializer):
    """
    Serializer for vest violations response.
    """
    total_count = serializers.IntegerField(help_text="Total number of vest violations")
    parameters_used = serializers.DictField(help_text="Parameters used for computation")
    by_zone_full = serializers.ListField(
        child=serializers.DictField(),
        help_text="Vest violations grouped by zone (full dataset)",
        required=False
    )
    by_zone = serializers.ListField(
        child=serializers.DictField(),
        help_text="Vest violations grouped by zone (current page only)"
    )
    statistics = serializers.DictField(help_text="Computation statistics")
    vest_violations = VestViolationDetailSerializer(
        many=True,
        required=False,
        help_text="Detailed vest violation information"
    )
    computed_at = serializers.DateTimeField(
        help_text="When the computation was performed",
        required=False
    )
    # Pagination metadata
    pagination = serializers.DictField(
        help_text="Pagination information for vest_violations",
        required=False
    )


