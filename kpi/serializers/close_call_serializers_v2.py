# kpi/serializers/close_call_serializers_v2.py
from rest_framework import serializers
from django.utils import timezone

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
        choices=[('vehicle', 'Vehicle'), ('pallet_truck', 'Pallet Truck'), ('agv', 'AGV')],
        required=False,
        help_text="Filter by specific vehicle class"
    )
    include_details = serializers.BooleanField(
        default=True,
        help_text="Whether to include individual close call details in response"
    )
    include_kpis = serializers.BooleanField(
        default=True,
        help_text="Whether to include comprehensive KPI calculations"
    )

    def validate(self, data):
        """Validate time range logic"""
        from_time = data.get('from_time')
        to_time = data.get('to_time')
        
        # Set default time range if not provided
        if not from_time and not to_time:
            data['from_time'] = timezone.now() - timezone.timedelta(hours=24)
            data['to_time'] = timezone.now()
        elif from_time and not to_time:
            data['to_time'] = timezone.now()
        elif to_time and not from_time:
            data['from_time'] = to_time - timezone.timedelta(hours=24)
        
        # Validate time order
        if from_time and to_time and from_time >= to_time:
            raise serializers.ValidationError("from_time must be before to_time")
        
        return data


class CloseCallKPIResponseSerializer(serializers.Serializer):
    """
    Serializer for close-call KPI computation response.
    """
    total_count = serializers.IntegerField(
        help_text="Total number of close calls detected",
        required=False  # Make it optional
    )
    close_calls = serializers.ListField(
        child=serializers.DictField(),
        required=False,
        help_text="Detailed close call information"
    )
    time_series = serializers.ListField(
        child=serializers.DictField(),
        help_text="Close calls aggregated by time",
        required=False
    )
    top_offenders = serializers.ListField(
        child=serializers.DictField(),
        required=False,
        help_text="Top offenders by close call count"
    )
    zone_analysis = serializers.DictField(
        required=False,
        help_text="Zone-based analysis"
    )
    near_miss_rate = serializers.DictField(
        required=False,
        help_text="Near miss rate calculations"
    )
    severity_analysis = serializers.DictField(
        required=False,
        help_text="Detailed severity analysis"
    )
    by_vehicle_class = serializers.DictField(
        help_text="Close calls grouped by vehicle class",
        required=False
    )
    by_severity = serializers.DictField(
        help_text="Close calls grouped by severity level", 
        required=False
    )
    statistics = serializers.DictField(
        help_text="Computation statistics",
        required=False
    )
    parameters_used = serializers.DictField(
        help_text="Parameters used for computation",
        required=False
    )
    computed_at = serializers.DateTimeField(
        help_text="When the computation was performed",
        required=False
    )
    include_details = serializers.BooleanField(
        help_text="Whether details are included",
        required=False
    )
    include_kpis = serializers.BooleanField(
        help_text="Whether KPIs are included",
        required=False
    )

    def to_representation(self, instance):
        """Custom representation to handle flexible data structure."""
        data = super().to_representation(instance)
        
        # Remove close_calls details if not requested
        if not instance.get('include_details', True):
            data.pop('close_calls', None)
            
        return data