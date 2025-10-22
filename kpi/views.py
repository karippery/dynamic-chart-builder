from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from drf_spectacular.utils import extend_schema, OpenApiParameter

from kpi.models import Detection
from kpi.serializers import AggregationRequestSerializer, AggregationSerializer

from .filters import DetectionFilter
from django_filters.rest_framework import DjangoFilterBackend
from .services.aggregation_service import AggregationService

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
        
        # Get aggregation results
        try:
            aggregation_result = AggregationService.aggregate_data(serializer.validated_data)
            
            # Handle both old and new return formats
            if isinstance(aggregation_result, dict) and 'results' in aggregation_result:
                # New format with metadata
                results = aggregation_result['results']
                metadata = aggregation_result['metadata']
                actual_bucket = metadata.get('time_bucket_used', '1h')
            else:
                # Old format (backward compatibility)
                results = aggregation_result
                actual_bucket = serializer.validated_data.get('time_bucket', '1h')
            
            # Return all results
            serialized_data = AggregationSerializer(results, many=True).data
            
            return Response({
                'series': serialized_data,
                'meta': {
                    'metric': serializer.validated_data.get('metric'),
                    'bucket': actual_bucket  # Use the actual bucket used
                }
            })
            
        except Exception as e:
            return Response(
                {'error': f'Aggregation failed: {str(e)}'}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )