from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from drf_spectacular.utils import extend_schema, OpenApiParameter
from django.core.cache import cache
from config.cache_utils import generate_cache_key, get_cache_timeout
from kpi.serializers.aggregation_serializer import AggregationRequestSerializer, AggregationSerializer

from ..filters import DetectionFilter
from django_filters.rest_framework import DjangoFilterBackend
from ..services.aggregation_service import AggregationService

class AggregationView(APIView):
    """
    API endpoint for aggregating detection data with various metrics and filters.
    
    Supports counting, unique object tracking, average speed calculations,
    and rate calculations with flexible grouping and filtering options.
    """
    filter_backends = (DjangoFilterBackend,)
    filterset_class = DetectionFilter

    
    @extend_schema(
        parameters=[
            OpenApiParameter(
                name='metric',
                description='Metric to calculate',
                required=True,
                type=str,
                enum=['count', 'unique_ids', 'avg_speed', 'rate']
            ),
            OpenApiParameter(
                name='entity',
                description='Entity type',
                type=str,
                enum=['events', 'objects'],
                default='events'
            ),
            OpenApiParameter(
                name='object_class',
                description='Filter by object class',
                type=str,
                many=True
            ),
            OpenApiParameter(
                name='vest',
                description='Filter by vest status',
                type=bool
            ),
            OpenApiParameter(
                name='group_by',
                description='Grouping dimensions',
                type=str,
                many=True,
                enum=['time_bucket', 'object_class', 'zone', 'id']
            ),
            OpenApiParameter(
                name='time_bucket',
                description='Time bucket size',
                type=str,
                enum=['1m', '5m', '15m', '1h', '6h', '1d'],
                default='1h'
            ),
            OpenApiParameter(
                name='from_time',
                description='Start time (ISO 8601)',
                type=str
            ),
            OpenApiParameter(
                name='to_time',
                description='End time (ISO 8601)',
                type=str
            ),
        ],
        responses=AggregationSerializer(many=True)
    )
    def get(self, request):
        # Validate query parameters
        serializer = AggregationRequestSerializer(data=request.query_params)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        
        validated_data = serializer.validated_data
        
        # Check if caching should be bypassed
        bypass_cache = request.query_params.get('bypass_cache', '').lower() in ('true', '1', 'yes')
        
        if not bypass_cache:
            # Generate cache key
            cache_key = generate_cache_key(validated_data)
            
            # Try to get cached data
            cached_data = cache.get(cache_key)
            if cached_data is not None:
                return Response(cached_data)
        
        try:
            # Get aggregation results
            aggregation_result = AggregationService.aggregate_data(validated_data)
            
            # Handle both old and new return formats
            if isinstance(aggregation_result, dict) and 'results' in aggregation_result:
                # New format with metadata
                results = aggregation_result['results']
                metadata = aggregation_result['metadata']
                actual_bucket = metadata.get('time_bucket_used', '1h')
            else:
                # Old format (backward compatibility)
                results = aggregation_result
                actual_bucket = validated_data.get('time_bucket', '1h')
            
            # Serialize data
            serialized_data = AggregationSerializer(results, many=True).data
            
            # Prepare response
            response_data = {
                'series': serialized_data,
                'meta': {
                    'metric': validated_data.get('metric'),
                    'bucket': actual_bucket,  # Use the actual bucket used
                    'cached': False
                }
            }
            
            # Cache the response if not bypassing cache
            if not bypass_cache:
                cache_key = generate_cache_key(validated_data)
                timeout = get_cache_timeout(actual_bucket)
                cache.set(cache_key, response_data, timeout)
                response_data['meta']['cached'] = True
                response_data['meta']['cache_ttl'] = timeout
            
            return Response(response_data)
            
        except Exception as e:
            return Response(
                {'error': f'Aggregation failed: {str(e)}'}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )