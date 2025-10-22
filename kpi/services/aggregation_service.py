from django.db.models import Count, Avg
from django.db.models.functions import Trunc
from kpi.models import Detection

class AggregationService:
    """Service for calculating aggregated metrics"""
    
    OVERSPEED_THRESHOLD = {
        'human': 2.0, 'vehicle': 5.0, 'pallet_truck': 3.0, 'agv': 4.0
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
        return queryset
    
    @classmethod
    def aggregate_data(cls, params):
        queryset = Detection.objects.all()
        
        
        # Apply filters
        filters = {
            'object_class': params.get('object_class'),
            'vest': params.get('vest'),
            'min_speed': params.get('min_speed'),
            'max_speed': params.get('max_speed'),
            'from_time': params.get('from_time'),
            'to_time': params.get('to_time'),
        }
        queryset = cls.apply_filters(queryset, filters)
        
        # Get grouping parameters
        group_by = params.get('group_by', [])
        time_bucket = params.get('time_bucket', '1h')
        metric = params.get('metric', 'count')

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
                if filters.get('from_time') and filters.get('to_time'):
                    time_range = filters['to_time'] - filters['from_time']
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
                results = queryset.annotate(
                    time_bucket=Trunc('timestamp', trunc_func)
                ).values('time_bucket', 'object_class').annotate(
                    value=Count('id')
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
                results = queryset.values('zone', 'object_class').annotate(
                    value=Count('id')
                ).order_by('zone', 'object_class')
            else:
                results = queryset.values('zone', 'object_class').annotate(
                    value=Count('id')
                ).order_by('zone', 'object_class')
        
        elif 'zone' in group_by:
            # Group by zone only - ADDED THIS MISSING CASE
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
                results = queryset.annotate(
                    time_bucket=Trunc('timestamp', trunc_func)
                ).values('time_bucket').annotate(
                    value=Count('id')
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
                if filters.get('from_time') and filters.get('to_time'):
                    time_range = filters['to_time'] - filters['from_time']
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