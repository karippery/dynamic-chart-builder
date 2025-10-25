from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from drf_spectacular.utils import extend_schema, OpenApiParameter, OpenApiExample
from django.utils import timezone
from django.core.cache import cache

from kpi.common.pagination import DefaultPagination
from kpi.serializers.close_call_serializers import (
    CloseCallDetectionRequestSerializer,
    CloseCallKPIResponseSerializer,
)
from kpi.services.close_call_service import CloseCallKPI, SafetyEventKPIService
from config.cache_utils import generate_cache_key, get_cache_timeout  # Import cache utilities


class CloseCallKPIView(APIView):
    """
    API endpoint for on-demand close-call KPI computation.
    
    Computes close calls between humans and vehicles in real-time
    without persisting results. Follows KPI builder pattern.
    """
    
    pagination_class = DefaultPagination
    
    @extend_schema(
        parameters=[
            OpenApiParameter(
                name='distance_threshold',
                description='Maximum distance in meters for close call detection',
                type=float,
                default=2.0
            ),
            OpenApiParameter(
                name='time_window_ms', 
                description='Time synchronization window in milliseconds (±value)',
                type=int,
                default=250
            ),
            OpenApiParameter(
                name='from_time',
                description='Start time for computation period (ISO 8601)',
                type=str
            ),
            OpenApiParameter(
                name='to_time',
                description='End time for computation period (ISO 8601)',
                type=str
            ),
            OpenApiParameter(
                name='zone',
                description='Filter by specific zone',
                type=str
            ),
            OpenApiParameter(
                name='object_class',
                description='Filter by specific vehicle class',
                type=str,
                enum=['vehicle', 'pallet_truck', 'agv']
            ),
            OpenApiParameter(
                name='include_details',
                description='Include individual close call details in response',
                type=bool,
                default=True
            ),
            OpenApiParameter(
                name='time_bucket',
                description='Time bucket for cache expiration',
                type=str,
                enum=['1m', '5m', '15m', '1h', '6h', '1d'],
                default='1h'
            ),
            OpenApiParameter(
                name='force_refresh',
                description='Force refresh cache and recompute results',
                type=bool,
                default=False
            ),
            OpenApiParameter(
                name='page',
                description='Page number for pagination',
                type=int,
                default=1
            ),
            OpenApiParameter(
                name='page_size',
                description='Number of items per page',
                type=int,
                default=10
            ),
        ],
        examples=[
            OpenApiExample(
                'Basic computation',
                summary='Compute close calls with default parameters',
                value={}
            ),
        ],
        responses=CloseCallKPIResponseSerializer
    )
    def get(self, request):
        """
        Compute close-call KPIs on-demand.
        """
        # Validate query parameters
        serializer = CloseCallDetectionRequestSerializer(data=request.query_params)
        if not serializer.is_valid():
            return Response(
                {'error': 'Invalid parameters', 'details': serializer.errors},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            # Extract parameters
            params = serializer.validated_data.copy()
            include_details = params.pop('include_details', True)
            time_bucket = params.pop('time_bucket', '1h')
            force_refresh = params.pop('force_refresh', False)
            
            # Extract pagination parameters separately
            page = params.pop('page', 1)
            page_size = params.pop('page_size', 10)
            
            # Map 'object_class' to 'vehicle_class' for CloseCallKPI
            if 'object_class' in params:
                params['vehicle_class'] = params.pop('object_class')
            
            # Generate cache key (include pagination params for cache variation)
            cache_params = params.copy()
            cache_params.update({
                'page': page,
                'page_size': page_size
            })
            cache_key = generate_cache_key(cache_params)
            
            # Check cache first (unless force refresh)
            if not force_refresh:
                cached_result = cache.get(cache_key)
                if cached_result is not None:
                    # Add cache metadata to response
                    cached_result['cache_metadata'] = {
                        'cached': True,
                        'cache_key': cache_key,
                        'served_from_cache': True
                    }
                    response_serializer = CloseCallKPIResponseSerializer(cached_result)
                    return Response(response_serializer.data)
            
            # Initialize KPI computer with only relevant parameters
            kpi_computer = CloseCallKPI(**params)
            
            # Compute close calls (no persistence)
            results = kpi_computer.compute_close_calls()
            
            # Apply pagination to close_calls and time_series
            paginator = self.pagination_class()
            paginator.page_size = page_size
            
            # Paginate close_calls
            close_calls_data = results.get('close_calls', [])
            paginated_close_calls = paginator.paginate_queryset(close_calls_data, request, view=self)
            
            # Paginate time_series
            time_series_data = results.get('time_series', [])
            paginated_time_series = paginator.paginate_queryset(time_series_data, request, view=self)
            
            # Update results with paginated data
            results['close_calls'] = paginated_close_calls
            results['time_series'] = paginated_time_series
            
            # Add pagination metadata
            results['pagination'] = {
                'close_calls': {
                    'count': len(close_calls_data),
                    'page': paginator.page.number,
                    'pages': paginator.page.paginator.num_pages if hasattr(paginator.page, 'paginator') else 1,
                    'page_size': paginator.get_page_size(request)
                },
                'time_series': {
                    'count': len(time_series_data),
                    'page': paginator.page.number,
                    'pages': paginator.page.paginator.num_pages if hasattr(paginator.page, 'paginator') else 1,
                    'page_size': paginator.get_page_size(request)
                }
            }
            
            # Add metadata
            results['parameters_used'] = params
            results['computed_at'] = timezone.now()
            results['include_details'] = include_details
            results['cache_metadata'] = {
                'cached': True,
                'cache_key': cache_key,
                'served_from_cache': False
            }
            
            # Cache the results
            cache_timeout = get_cache_timeout(time_bucket)
            cache.set(cache_key, results, timeout=cache_timeout)
            
            # Serialize response
            response_serializer = CloseCallKPIResponseSerializer(results)
            
            return Response(response_serializer.data)
            
        except Exception as e:
            return Response(
                {'error': f'Close-call computation failed: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
        