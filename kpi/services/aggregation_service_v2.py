from django.db.models import Count, Avg, Q, F, ExpressionWrapper, FloatField
from django.db.models.functions import Trunc
from django.utils import timezone
from datetime import timedelta
from kpi.models import Detection

class AggregationServiceV2:
    """Service for calculating aggregated metrics"""
    
    OVERSPEED_THRESHOLD = {
        'human': 2.0, 'vehicle': 5.0, 'pallet_truck': 3.0, 'agv': 4.0
    }
    
    # Bucket duration in hours for rate calculation
    BUCKET_DURATIONS = {
        '1m': 1/60,   # 1 minute = 1/60 hour
        '5m': 5/60,   # 5 minutes = 5/60 hour  
        '15m': 15/60, # 15 minutes = 15/60 hour
        '1h': 1.0,    # 1 hour = 1 hour
        '6h': 6.0,    # 6 hours = 6 hours
        '1d': 24.0    # 1 day = 24 hours
    }
    
    @classmethod
    def apply_filters(cls, queryset, filters):
        """Apply filters to the base queryset"""
        if filters.get('object_class'):
            queryset = queryset.filter(object_class__in=filters['object_class'])
        if filters.get('vest') is not None:
            queryset = queryset.filter(vest=filters['vest'])
        if filters.get('min_speed') is not None:
            queryset = queryset.filter(speed__gte=filters['min_speed'])
        if filters.get('max_speed') is not None:
            queryset = queryset.filter(speed__lte=filters['max_speed'])
        if filters.get('from_time'):
            queryset = queryset.filter(timestamp__gte=filters['from_time'])
        if filters.get('to_time'):
            queryset = queryset.filter(timestamp__lte=filters['to_time'])
        if filters.get('zone'):
            queryset = queryset.filter(zone__in=filters['zone'])
        return queryset
    
    @classmethod
    def validate_time_range(cls, from_time, to_time):
        """Validate time range parameters"""
        if from_time and to_time and from_time > to_time:
            raise ValueError("from_time cannot be after to_time")
        
        # Optional: Add reasonable limits to prevent huge queries
        if from_time and to_time:
            time_diff = to_time - from_time
            if time_diff.days > 365:  # Limit to 1 year max
                raise ValueError("Time range cannot exceed 1 year")
    
    @classmethod
    def calculate_vest_compliance(cls, queryset):
        """Calculate vest compliance percentage for humans only"""
        human_detections = queryset.filter(object_class='human')
        total_with_vest_data = human_detections.exclude(vest__isnull=True).count()
        vest_compliant = human_detections.filter(vest=True).count()
        
        if total_with_vest_data > 0:
            return (vest_compliant / total_with_vest_data) * 100
        return 0
    
    @classmethod
    def get_active_counts(cls, minutes=15, use_test_data=False):
        
        active_humans = Detection.objects.filter(
        object_class='human'
        ).values('tracking_id').distinct().count()
        
        # Count distinct tracking_ids for vehicles
        active_vehicles = Detection.objects.filter(
            object_class__in=['vehicle', 'pallet_truck', 'agv']
        ).values('tracking_id').distinct().count()
        
        # Total detection volume (all records)
        detection_volume = Detection.objects.count()
        
        return {
            'active_humans': active_humans,
            'active_vehicles': active_vehicles,
            'detection_volume': detection_volume
        }
    
    @classmethod
    def aggregate_data(cls, params):
        # Validate time range first
        from_time = params.get('from_time')
        to_time = params.get('to_time')
        cls.validate_time_range(from_time, to_time)
        
        queryset = Detection.objects.all()
        
        # Apply filters
        filters = {
            'object_class': params.get('object_class'),
            'vest': params.get('vest'),
            'min_speed': params.get('min_speed'),
            'max_speed': params.get('max_speed'),
            'from_time': from_time,
            'to_time': to_time,
            'zone': params.get('zone'),
        }
        queryset = cls.apply_filters(queryset, filters)
        
        # Get grouping parameters
        group_by = params.get('group_by', [])
        time_bucket = params.get('time_bucket', '1h')
        metric = params.get('metric', 'count')

        # Handle vest compliance as a special metric
        if metric == 'vest_compliance':
            compliance_rate = cls.calculate_vest_compliance(queryset)
            if not group_by:
                return [{'value': compliance_rate}]
            # For grouped vest compliance, we need special handling
            # This would require additional implementation

        # If no grouping, return single value
        if not group_by:
            if metric == 'count':
                value = queryset.count()
            elif metric == 'unique_ids':
                value = queryset.values('tracking_id').distinct().count()
            elif metric == 'avg_speed':
                value = queryset.aggregate(avg_speed=Avg('speed'))['avg_speed'] or 0
            elif metric == 'rate':
                # Simple rate calculation (events per hour)
                if from_time and to_time:
                    time_range = to_time - from_time
                    hours = time_range.total_seconds() / 3600
                    value = queryset.count() / hours if hours > 0 else queryset.count()
                else:
                    value = queryset.count()
            else:
                value = queryset.count()
            return [{'value': value}]
        
        # Handle different grouping combinations explicitly
        if 'time_bucket' in group_by and 'object_class' in group_by:
            # Group by time and object class
            trunc_map = {'1m': 'minute', '5m': 'minute', '15m': 'minute', '1h': 'hour', '6h': 'hour', '1d': 'day'}
            trunc_func = trunc_map.get(time_bucket, 'hour')
            
            if metric == 'count':
                results = queryset.annotate(
                    time_bucket=Trunc('timestamp', trunc_func)
                ).values('time_bucket', 'object_class').annotate(
                    value=Count('id')
                ).order_by('time_bucket', 'object_class')
            elif metric == 'unique_ids':
                results = queryset.annotate(
                    time_bucket=Trunc('timestamp', trunc_func)
                ).values('time_bucket', 'object_class').annotate(
                    value=Count('tracking_id', distinct=True)
                ).order_by('time_bucket', 'object_class')
            elif metric == 'avg_speed':
                results = queryset.annotate(
                    time_bucket=Trunc('timestamp', trunc_func)
                ).values('time_bucket', 'object_class').annotate(
                    value=Avg('speed')
                ).order_by('time_bucket', 'object_class')
            elif metric == 'rate':
                bucket_hours = cls.BUCKET_DURATIONS.get(time_bucket, 1.0)
                results = queryset.annotate(
                    time_bucket=Trunc('timestamp', trunc_func)
                ).values('time_bucket', 'object_class').annotate(
                    raw_count=Count('id')
                ).annotate(
                    value=ExpressionWrapper(
                        F('raw_count') / bucket_hours,
                        output_field=FloatField()
                    )
                ).order_by('time_bucket', 'object_class')
            else:
                results = queryset.annotate(
                    time_bucket=Trunc('timestamp', trunc_func)
                ).values('time_bucket', 'object_class').annotate(
                    value=Count('id')
                ).order_by('time_bucket', 'object_class')
        
        elif 'object_class' in group_by and 'vest' in group_by:
            # Group by object class and vest
            if metric == 'count':
                results = queryset.values('object_class', 'vest').annotate(
                    value=Count('id')
                ).order_by('object_class', 'vest')
            elif metric == 'unique_ids':
                results = queryset.values('object_class', 'vest').annotate(
                    value=Count('tracking_id', distinct=True)
                ).order_by('object_class', 'vest')
            elif metric == 'avg_speed':
                results = queryset.values('object_class', 'vest').annotate(
                    value=Avg('speed')
                ).order_by('object_class', 'vest')
            elif metric == 'rate':
                # For rate without time bucket, use overall rate
                if from_time and to_time:
                    time_range = to_time - from_time
                    hours = time_range.total_seconds() / 3600
                    results = queryset.values('object_class', 'vest').annotate(
                        raw_count=Count('id')
                    ).annotate(
                        value=ExpressionWrapper(
                            F('raw_count') / hours,
                            output_field=FloatField()
                        )
                    ).order_by('object_class', 'vest')
                else:
                    results = queryset.values('object_class', 'vest').annotate(
                        value=Count('id')
                    ).order_by('object_class', 'vest')
            else:
                results = queryset.values('object_class', 'vest').annotate(
                    value=Count('id')
                ).order_by('object_class', 'vest')
        
        elif 'object_class' in group_by:
            # Group by object class only
            if metric == 'count':
                results = queryset.values('object_class').annotate(
                    value=Count('id')
                ).order_by('object_class')
            elif metric == 'unique_ids':
                results = queryset.values('object_class').annotate(
                    value=Count('tracking_id', distinct=True)
                ).order_by('object_class')
            elif metric == 'avg_speed':
                results = queryset.values('object_class').annotate(
                    value=Avg('speed')
                ).order_by('object_class')
            elif metric == 'rate':
                if from_time and to_time:
                    time_range = to_time - from_time
                    hours = time_range.total_seconds() / 3600
                    results = queryset.values('object_class').annotate(
                        raw_count=Count('id')
                    ).annotate(
                        value=ExpressionWrapper(
                            F('raw_count') / hours,
                            output_field=FloatField()
                        )
                    ).order_by('object_class')
                else:
                    results = queryset.values('object_class').annotate(
                        value=Count('id')
                    ).order_by('object_class')
            else:
                results = queryset.values('object_class').annotate(
                    value=Count('id')
                ).order_by('object_class')
        
        elif 'zone' in group_by and 'object_class' in group_by:
            # Group by zone and object class
            if metric == 'count':
                results = queryset.values('zone', 'object_class').annotate(
                    value=Count('id')
                ).order_by('zone', 'object_class')
            elif metric == 'unique_ids':
                results = queryset.values('zone', 'object_class').annotate(
                    value=Count('tracking_id', distinct=True)
                ).order_by('zone', 'object_class')
            elif metric == 'avg_speed':
                results = queryset.values('zone', 'object_class').annotate(
                    value=Avg('speed')
                ).order_by('zone', 'object_class')
            elif metric == 'rate':
                if from_time and to_time:
                    time_range = to_time - from_time
                    hours = time_range.total_seconds() / 3600
                    results = queryset.values('zone', 'object_class').annotate(
                        raw_count=Count('id')
                    ).annotate(
                        value=ExpressionWrapper(
                            F('raw_count') / hours,
                            output_field=FloatField()
                        )
                    ).order_by('zone', 'object_class')
                else:
                    results = queryset.values('zone', 'object_class').annotate(
                        value=Count('id')
                    ).order_by('zone', 'object_class')
            else:
                results = queryset.values('zone', 'object_class').annotate(
                    value=Count('id')
                ).order_by('zone', 'object_class')
        
        elif 'zone' in group_by:
            # Group by zone only
            if metric == 'count':
                results = queryset.values('zone').annotate(
                    value=Count('id')
                ).order_by('zone')
            elif metric == 'unique_ids':
                results = queryset.values('zone').annotate(
                    value=Count('tracking_id', distinct=True)
                ).order_by('zone')
            elif metric == 'avg_speed':
                results = queryset.values('zone').annotate(
                    value=Avg('speed')
                ).order_by('zone')
            elif metric == 'rate':
                if from_time and to_time:
                    time_range = to_time - from_time
                    hours = time_range.total_seconds() / 3600
                    results = queryset.values('zone').annotate(
                        raw_count=Count('id')
                    ).annotate(
                        value=ExpressionWrapper(
                            F('raw_count') / hours,
                            output_field=FloatField()
                        )
                    ).order_by('zone')
                else:
                    results = queryset.values('zone').annotate(
                        value=Count('id')
                    ).order_by('zone')
            else:
                results = queryset.values('zone').annotate(
                    value=Count('id')
                ).order_by('zone')
        
        elif 'vest' in group_by:
            # Group by vest only
            if metric == 'count':
                results = queryset.values('vest').annotate(
                    value=Count('id')
                ).order_by('vest')
            elif metric == 'unique_ids':
                results = queryset.values('vest').annotate(
                    value=Count('tracking_id', distinct=True)
                ).order_by('vest')
            elif metric == 'avg_speed':
                results = queryset.values('vest').annotate(
                    value=Avg('speed')
                ).order_by('vest')
            elif metric == 'rate':
                if from_time and to_time:
                    time_range = to_time - from_time
                    hours = time_range.total_seconds() / 3600
                    results = queryset.values('vest').annotate(
                        raw_count=Count('id')
                    ).annotate(
                        value=ExpressionWrapper(
                            F('raw_count') / hours,
                            output_field=FloatField()
                        )
                    ).order_by('vest')
                else:
                    results = queryset.values('vest').annotate(
                        value=Count('id')
                    ).order_by('vest')
            else:
                results = queryset.values('vest').annotate(
                    value=Count('id')
                ).order_by('vest')
        
        elif 'time_bucket' in group_by:
            # Group by time only
            trunc_map = {'1m': 'minute', '5m': 'minute', '15m': 'minute', '1h': 'hour', '6h': 'hour', '1d': 'day'}
            trunc_func = trunc_map.get(time_bucket, 'hour')
            
            if metric == 'count':
                results = queryset.annotate(
                    time_bucket=Trunc('timestamp', trunc_func)
                ).values('time_bucket').annotate(
                    value=Count('id')
                ).order_by('time_bucket')
            elif metric == 'unique_ids':
                results = queryset.annotate(
                    time_bucket=Trunc('timestamp', trunc_func)
                ).values('time_bucket').annotate(
                    value=Count('tracking_id', distinct=True)
                ).order_by('time_bucket')
            elif metric == 'avg_speed':
                results = queryset.annotate(
                    time_bucket=Trunc('timestamp', trunc_func)
                ).values('time_bucket').annotate(
                    value=Avg('speed')
                ).order_by('time_bucket')
            elif metric == 'rate':
                bucket_hours = cls.BUCKET_DURATIONS.get(time_bucket, 1.0)
                results = queryset.annotate(
                    time_bucket=Trunc('timestamp', trunc_func)
                ).values('time_bucket').annotate(
                    raw_count=Count('id')
                ).annotate(
                    value=ExpressionWrapper(
                        F('raw_count') / bucket_hours,
                        output_field=FloatField()
                    )
                ).order_by('time_bucket')
            else:
                results = queryset.annotate(
                    time_bucket=Trunc('timestamp', trunc_func)
                ).values('time_bucket').annotate(
                    value=Count('id')
                ).order_by('time_bucket')
        
        else:
            # Fallback - no valid grouping
            if metric == 'count':
                value = queryset.count()
            elif metric == 'unique_ids':
                value = queryset.values('tracking_id').distinct().count()
            elif metric == 'avg_speed':
                value = queryset.aggregate(avg_speed=Avg('speed'))['avg_speed'] or 0
            elif metric == 'rate':
                if from_time and to_time:
                    time_range = to_time - from_time
                    hours = time_range.total_seconds() / 3600
                    value = queryset.count() / hours if hours > 0 else queryset.count()
                else:
                    value = queryset.count()
            else:
                value = queryset.count()
            results = [{'value': value}]
        
        # Convert to list and format results
        results_list = list(results)
        # Format results for serialization - INCLUDE ALL FIELDS
        formatted_results = []
        for item in results_list:
            formatted_item = {'value': item['value'] or 0}
            
            # Include ALL fields from the grouped query
            for key, value in item.items():
                if key != 'value':
                    if hasattr(value, 'isoformat'):  # Time field
                        formatted_item['time'] = value.isoformat() + 'Z'
                    else:  # All other grouping fields
                        formatted_item[key] = value
                
            formatted_results.append(formatted_item)
    
        # Return both results and the actual time_bucket used
        return {
                'results': formatted_results,
                'metadata': {
                    'time_bucket_used': time_bucket,
                    'metric': metric,
                    'total_results': len(formatted_results)
                }
            }