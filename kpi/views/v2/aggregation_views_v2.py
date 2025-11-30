from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from drf_spectacular.utils import extend_schema, OpenApiParameter
from django.core.cache import cache
from config.cache_utils import generate_cache_key, get_cache_timeout
from kpi.filters import DetectionFilter
from kpi.models import Detection
from kpi.serializers.aggregation_serializer import AggregationRequestSerializer, AggregationSerializer


from django_filters.rest_framework import DjangoFilterBackend

from kpi.services.aggregation_service_v2 import AggregationServiceV2

class AggregationViewV2(APIView):
    """
    API endpoint for aggregating detection data with various metrics and filters.
    
    Supports counting, unique object tracking, average speed calculations,
    rate calculations, and vest compliance with flexible grouping and filtering options.
    """
    filter_backends = (DjangoFilterBackend,)
    filterset_class = DetectionFilter

    
    @extend_schema(
        tags=['V2'],
        parameters=[
            OpenApiParameter(
                name='metric',
                description='Metric to calculate',
                required=True,
                type=str,
                enum=['count', 'unique_ids', 'avg_speed', 'rate', 'vest_compliance']
            ),
            OpenApiParameter(
                name='object_class',
                description='Filter by object class',
                type=str,
                many=True,
                enum=['human', 'vehicle', 'pallet_truck', 'agv']
            ),
            OpenApiParameter(
                name='vest',
                description='Filter by vest status',
                type=bool
            ),
            OpenApiParameter(
                name='zone',
                description='Filter by zone (area)',
                type=str,
                many=True
            ),
            OpenApiParameter(
                name='group_by',
                description='Grouping dimensions',
                type=str,
                many=True,
                enum=['time_bucket', 'object_class', 'zone', 'vest']
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
            OpenApiParameter(
                name='bypass_cache',
                description='Bypass cache (true/false)',
                type=bool,
                default=False
            ),
        ],
        responses={
            200: AggregationSerializer(many=True),
            400: {'description': 'Bad Request - Invalid parameters'},
            500: {'description': 'Internal Server Error'}
        }
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
            aggregation_result = AggregationServiceV2.aggregate_data(validated_data)
            
            # Handle both old and new return formats
            if isinstance(aggregation_result, dict) and 'results' in aggregation_result:
                # New format with metadata
                results = aggregation_result['results']
                metadata = aggregation_result['metadata']
                actual_bucket = metadata.get('time_bucket_used', '1h')
                total_results = metadata.get('total_results', len(results))
            else:
                # Old format (backward compatibility)
                results = aggregation_result
                actual_bucket = validated_data.get('time_bucket', '1h')
                total_results = len(results)
            
            # Serialize data
            serialized_data = AggregationSerializer(results, many=True).data
            
            # Prepare response according to specification
            response_data = {
                'series': serialized_data,
                'meta': {
                    'metric': validated_data.get('metric'),
                    'bucket': actual_bucket,
                    'total_results': total_results,
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
            
        except ValueError as e:
            # Handle validation errors from service layer
            return Response(
                {'error': f'Invalid parameters: {str(e)}'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        except Exception as e:
            return Response(
                {'error': f'Aggregation failed: {str(e)}'}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

class DashboardMetricsView(APIView):
    @extend_schema(
        tags=['V2'],
    )
    def get(self, request):
        """
        Get real-time dashboard metrics for top cards.
        """
        try:
            # Always use test data mode for now
            use_test_data = True
            
            # Get active counts
            active_counts = AggregationServiceV2.get_active_counts(minutes=15, use_test_data=use_test_data)
            
            # For vest compliance, use all data
            queryset = Detection.objects.all()
            
            # Apply additional filters
            filters = {
                'object_class': request.query_params.getlist('object_class', []),
                'zone': request.query_params.getlist('zone', [])
            }
            queryset = AggregationServiceV2.apply_filters(queryset, filters)
            
            # Calculate vest compliance
            vest_compliance = AggregationServiceV2.calculate_vest_compliance(queryset)
            
            response_data = {
                'active_humans': active_counts['active_humans'],
                'active_vehicles': active_counts['active_vehicles'],
                'detection_volume': active_counts['detection_volume'],
                'vest_compliance': round(vest_compliance, 2)
            }
            
            return Response(response_data)
            
        except Exception as e:
            return Response(
                {'error': f'Metrics calculation failed: {str(e)}'}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            ) 
        
class LatestDetectionsView(APIView):
    """
    API endpoint for latest detections table.
    Provides the most recent detection records for data sanity checking.
    """
    
    @extend_schema(
        tags=['V2'],
        parameters=[
            OpenApiParameter(
                name='limit',
                description='Number of records to return (20-50)',
                type=int,
                default=20
            ),
            OpenApiParameter(
                name='object_class',
                description='Filter by object class',
                type=str,
                many=True,
                enum=['human', 'vehicle', 'pallet_truck', 'agv']
            ),
            OpenApiParameter(
                name='zone',
                description='Filter by zone (area)',
                type=str,
                many=True
            ),
            OpenApiParameter(
                name='vest',
                description='Filter by vest status',
                type=str,  # Change from bool to str to handle string values
                enum=['true', 'false', '1', '0']  # Add allowed string values
            ),
        ],
        responses={
            200: {
                'type': 'object',
                'properties': {
                    'detections': {
                        'type': 'array',
                        'items': {
                            'type': 'object',
                            'properties': {
                                'timestamp': {'type': 'string', 'format': 'date-time'},
                                'id': {'type': 'string'},
                                'object_class': {'type': 'string'},  # Fixed: use object_class instead of type
                                'zone': {'type': 'string'},  # Fixed: use zone instead of area
                                'x': {'type': 'number', 'format': 'float'},
                                'y': {'type': 'number', 'format': 'float'},
                                'speed': {'type': 'number', 'format': 'float'},
                                'vest': {'type': 'boolean'},
                                'heading': {'type': 'number', 'format': 'float'}
                            }
                        }
                    },
                    'total': {'type': 'integer'}
                }
            }
        }
    )
    def get(self, request):
        """
        Get latest detection records for the bottom table.
        """
        try:
            # Get limit with validation
            limit = int(request.query_params.get('limit', 20))
            limit = max(20, min(50, limit))  # Constrain between 20-50
            
            # Handle vest filter properly
            vest_param = request.query_params.get('vest')
            vest_bool = None
            if vest_param is not None:
                # Convert string to boolean
                vest_bool = vest_param.lower() in ('true', '1', 'yes')
            
            # Build filters
            filters = {
                'object_class': request.query_params.getlist('object_class', []),
                'zone': request.query_params.getlist('zone', []),
                'vest': vest_bool  # Use the converted boolean value
            }
            
            # Apply filters and get latest records
            queryset = Detection.objects.all()
            queryset = AggregationServiceV2.apply_filters(queryset, filters)
            
            # Get latest records ordered by timestamp descending
            detections = queryset.order_by('-timestamp')[:limit]
            
            # Format response according to specification - USE ACTUAL MODEL FIELD NAMES
            detection_data = []
            for detection in detections:
                detection_data.append({
                    'timestamp': detection.timestamp.isoformat() + 'Z',
                    'id': detection.tracking_id,  # Use tracking_id instead of id
                    'object_class': detection.object_class,  # Use object_class instead of type
                    'zone': detection.zone,  # Use zone instead of area
                    'x': float(detection.x),
                    'y': float(detection.y),
                    'speed': float(detection.speed) if detection.speed is not None else 0.0,
                    'vest': bool(detection.vest) if detection.vest is not None else None,
                    'heading': float(detection.heading) if detection.heading is not None else 0.0
                })
            
            response_data = {
                'detections': detection_data,
                'total': len(detection_data)
            }
            
            return Response(response_data)
            
        except Exception as e:
            return Response(
                {'error': f'Failed to fetch latest detections: {str(e)}'}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
        
