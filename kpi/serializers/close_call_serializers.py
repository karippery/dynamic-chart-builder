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
        required=False  # Make it optional
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

    def to_representation(self, instance):
        """Custom representation to handle flexible data structure."""
        data = super().to_representation(instance)
        
        # Remove close_calls details if not requested
        if not instance.get('include_details', True):
            data.pop('close_calls', None)
            
        return data


class OverspeedKPISerializer(serializers.Serializer):
    """Serializer for overspeed KPI response."""
    total_count = serializers.IntegerField()
    speed_threshold = serializers.FloatField()
    by_object_class = serializers.ListField(child=serializers.DictField())
    statistics = serializers.DictField()


class VestViolationKPISerializer(serializers.Serializer):
    """Serializer for vest violation KPI response."""
    total_count = serializers.IntegerField()
    by_zone = serializers.ListField(child=serializers.DictField())
    statistics = serializers.DictField()


class SafetyKPISummarySerializer(serializers.Serializer):
    """Serializer for comprehensive safety KPI summary."""
    close_calls = CloseCallKPIResponseSerializer(help_text="Close call metrics")
    overspeed_events = OverspeedKPISerializer(help_text="Overspeed event metrics")
    vest_violations = VestViolationKPISerializer(help_text="Vest violation metrics")
    metadata = serializers.DictField(help_text="Computation metadata")