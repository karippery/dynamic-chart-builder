from rest_framework import serializers
from kpi.models import Detection


class AggregationSerializer(serializers.Serializer):
    """Serializer for aggregated KPI results."""
    
    time = serializers.DateTimeField(required=False)
    class_name = serializers.CharField(required=False, source='object_class')
    zone = serializers.CharField(required=False)
    vest = serializers.BooleanField(required=False)  
    tracking_id = serializers.CharField(required=False)
    value = serializers.FloatField()
    
    def to_representation(self, instance: dict) -> dict:
        """
        Custom representation to use 'class' field name in output.
        
        Args:
            instance: The data instance to serialize
            
        Returns:
            dict: Serialized data with 'class' field name
        """
        data = super().to_representation(instance)
        if 'class_name' in data:
            data['class'] = data.pop('class_name')
        return data


class AggregationRequestSerializer(serializers.Serializer):
    """Serializer for validating and parsing aggregation parameters."""
    
    METRIC_CHOICES = ['count', 'unique_ids', 'avg_speed', 'rate']
    ENTITY_CHOICES = ['events', 'objects']
    TIME_BUCKET_CHOICES = ['1m', '5m', '15m', '1h', '6h', '1d']

    metric = serializers.ChoiceField(choices=METRIC_CHOICES)
    entity = serializers.ChoiceField(choices=ENTITY_CHOICES, default='events', required=False)
    
    # Support both 'class' and 'object_class' parameters
    class_param = serializers.CharField(required=False, source='object_class')
    object_class = serializers.CharField(required=False)
    
    vest = serializers.CharField(required=False)
    group_by = serializers.CharField(required=False)
    
    time_bucket = serializers.ChoiceField(
        choices=TIME_BUCKET_CHOICES,
        default='1h',
        required=False
    )
    
    # Support both 'from' and 'from_time'
    from_param = serializers.DateTimeField(required=False, source='from_time')
    from_time = serializers.DateTimeField(required=False)
    
    # Support both 'to' and 'to_time'  
    to_param = serializers.DateTimeField(required=False, source='to_time')
    to_time = serializers.DateTimeField(required=False)
    
    min_speed = serializers.FloatField(required=False)
    max_speed = serializers.FloatField(required=False)

    def validate(self, data: dict) -> dict:
        """
        Handle all parameter mapping and parsing.
        
        Args:
            data: Input validation data
            
        Returns:
            dict: Validated and normalized parameters
        """
        data = self._normalize_parameter_aliases(data)
        data = self._parse_group_by_parameter(data)
        data = self._ensure_group_by_format(data)
        
        return data

    def _normalize_parameter_aliases(self, data: dict) -> dict:
        """Normalize parameter aliases to canonical names."""
        # Handle 'class' parameter
        if 'class_param' in data:
            data['object_class'] = data.pop('class_param')
        
        # Handle 'from' parameter  
        if 'from_param' in data:
            data['from_time'] = data.pop('from_param')
            
        # Handle 'to' parameter
        if 'to_param' in data:
            data['to_time'] = data.pop('to_param')
            
        return data

    def _parse_group_by_parameter(self, data: dict) -> dict:
        """Parse group_by parameter with time_bucket format."""
        if 'group_by' in data and isinstance(data['group_by'], str):
            group_by_parts = data['group_by'].split(',')
            parsed_group_by = []
            time_bucket_from_group = None
            
            for part in group_by_parts:
                part = part.strip()
                if ':' in part:
                    key, value = part.split(':', 1)
                    key = key.strip()
                    value = value.strip()
                    
                    if key == 'time_bucket':
                        time_bucket_from_group = value
                        parsed_group_by.append('time_bucket')
                    elif key == 'class':
                        parsed_group_by.append('object_class')
                else:
                    if part == 'class':
                        parsed_group_by.append('object_class')
                    else:
                        parsed_group_by.append(part)
            
            data['group_by'] = parsed_group_by
            
            # Set time_bucket from group_by if present
            if time_bucket_from_group:
                data['time_bucket'] = time_bucket_from_group
            
        return data

    def _ensure_group_by_format(self, data: dict) -> dict:
        """Ensure group_by is always a list."""
        if 'group_by' not in data:
            data['group_by'] = []
        elif isinstance(data['group_by'], str):
            data['group_by'] = [data['group_by']]
            
        return data

    def validate_object_class(self, value: str) -> list[str]:
        """
        Convert comma-separated string to list and validate against choices.
        
        Args:
            value: Comma-separated object class string
            
        Returns:
            list: Validated object classes
            
        Raises:
            ValidationError: If any class is invalid
        """
        if value and isinstance(value, str):
            classes = [cls.strip() for cls in value.split(',')]
            valid_choices = [choice[0] for choice in Detection.ObjectClass.choices]
            
            for cls in classes:
                if cls not in valid_choices:
                    raise serializers.ValidationError(
                        f"'{cls}' is not a valid object class. "
                        f"Valid choices are: {', '.join(valid_choices)}"
                    )
            return classes
        return value

    def validate_vest(self, value: str) -> bool:
        """
        Convert string representation to boolean.
        
        Args:
            value: String representation of vest status
            
        Returns:
            bool: Parsed vest status
            
        Raises:
            ValidationError: If value cannot be parsed
        """
        if value is None:
            return None
            
        if isinstance(value, str):
            true_values = ['1', 'true', 'yes']
            false_values = ['0', 'false', 'no']
            
            if value.lower() in true_values:
                return True
            elif value.lower() in false_values:
                return False
            else:
                raise serializers.ValidationError(
                    f"Vest must be one of: {', '.join(true_values + false_values)}"
                )
                
        return bool(value)