# kpi/serializers/safety_violation_serializers.py
from rest_framework import serializers
from django.utils import timezone


class SafetyViolationRequestSerializer(serializers.Serializer):
    """
    Serializer for safety violation request parameters.
    """
    from_time = serializers.DateTimeField(
        required=False,
        help_text="Start time for analysis period"
    )
    to_time = serializers.DateTimeField(
        required=False,
        help_text="End time for analysis period"
    )
    zone = serializers.CharField(
        required=False,
        help_text="Filter by specific zone"
    )
    speed_threshold = serializers.FloatField(
        default=1.5,
        min_value=0.1,
        max_value=10.0,
        help_text="Speed threshold for overspeed detection (m/s)"
    )
    include_humans_in_speed = serializers.BooleanField(
        default=False,
        help_text="Include humans in overspeed monitoring"
    )
    include_details = serializers.BooleanField(
        default=True,
        help_text="Include detailed violation records in response"
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


class VestViolationDetailSerializer(serializers.Serializer):
    """Serializer for individual vest violation details."""
    id = serializers.IntegerField()
    timestamp = serializers.DateTimeField()
    tracking_id = serializers.CharField()
    x = serializers.FloatField()
    y = serializers.FloatField()
    zone = serializers.CharField(allow_null=True)


class OverspeedEventDetailSerializer(serializers.Serializer):
    """Serializer for individual overspeed event details."""
    id = serializers.IntegerField()
    timestamp = serializers.DateTimeField()
    tracking_id = serializers.CharField()
    object_class = serializers.CharField()
    speed = serializers.FloatField()
    x = serializers.FloatField()
    y = serializers.FloatField()
    zone = serializers.CharField(allow_null=True)


class SafetyViolationResponseSerializer(serializers.Serializer):
    """
    Serializer for comprehensive safety violation response.
    """
    # Top Cards Data
    top_cards = serializers.DictField(help_text="Top cards metrics for dashboard")
    
    # Detailed Data
    vest_violations = VestViolationDetailSerializer(
        many=True, 
        required=False,
        help_text="Detailed vest violation information"
    )
    overspeed_events = OverspeedEventDetailSerializer(
        many=True, 
        required=False,
        help_text="Detailed overspeed event information"
    )
    
    # Analysis Data
    time_series = serializers.ListField(
        child=serializers.DictField(),
        help_text="Violations aggregated by time",
        required=False
    )
    zone_analysis = serializers.DictField(
        help_text="Zone-based analysis of violations",
        required=False
    )
    repeat_offenders = serializers.DictField(
        help_text="Repeat offenders analysis",
        required=False
    )
    
    # Metadata
    statistics = serializers.DictField(help_text="Computation statistics")
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