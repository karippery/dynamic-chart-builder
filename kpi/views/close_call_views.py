from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from drf_spectacular.utils import extend_schema, OpenApiParameter, OpenApiExample
from django.utils import timezone
from django.core.cache import cache

from kpi.serializers.close_call_serializers import (
    CloseCallDetectionRequestSerializer,
    CloseCallKPIResponseSerializer,
    SafetyKPISummarySerializer
)
from kpi.services.close_call_service import CloseCallKPI, SafetyEventKPIService
from config.cache_utils import generate_cache_key, get_cache_timeout  # Import cache utilities


class CloseCallKPIView(APIView):
    """
    API endpoint for on-demand close-call KPI computation.
    
    Computes close calls between humans and vehicles in real-time
    without persisting results. Follows KPI builder pattern.
    """
    
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
        
        Returns aggregated metrics without persisting results.
        Suitable for real-time dashboard and reporting.
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
            
            # Generate cache key
            cache_key = generate_cache_key(params)
            
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
            
            # Initialize KPI computer
            kpi_computer = CloseCallKPI(**params)
            
            # Compute close calls (no persistence)
            results = kpi_computer.compute_close_calls()
            
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


class SafetyKPIView(APIView):
    """
    API endpoint for comprehensive safety KPI computation.
    """
    
    @extend_schema(
        parameters=[
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
                name='close_call_distance',
                description='Close call distance threshold',
                type=float,
                default=2.0
            ),
            OpenApiParameter(
                name='overspeed_threshold', 
                description='Overspeed threshold in m/s (vehicles only)',
                type=float,
                default=1.5
            ),
            OpenApiParameter(
                name='overspeed_include_humans',
                description='Include humans in overspeed monitoring (not recommended)',
                type=bool,
                default=False
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
        ],
        responses=SafetyKPISummarySerializer
    )
    def get(self, request):
        """
        Compute all safety KPIs in a single call.
        """
        try:
            # Extract parameters
            from_time = request.GET.get('from_time')
            to_time = request.GET.get('to_time')
            zone = request.GET.get('zone')
            time_bucket = request.GET.get('time_bucket', '1h')
            force_refresh = request.GET.get('force_refresh', 'false').lower() == 'true'
            
            close_call_params = {
                'distance_threshold': float(request.GET.get('close_call_distance', 2.0))
            }
            
            overspeed_params = {
                'speed_threshold': float(request.GET.get('overspeed_threshold', 1.5)),
                'include_humans': request.GET.get('overspeed_include_humans', 'false').lower() == 'true'
            }
            
            # Create parameters dict for cache key generation
            cache_params = {
                'from_time': from_time,
                'to_time': to_time,
                'zone': zone,
                'time_bucket': time_bucket,
                'close_call_distance': close_call_params['distance_threshold'],
                'overspeed_threshold': overspeed_params['speed_threshold'],
                'overspeed_include_humans': overspeed_params['include_humans']
            }
            
            # Generate cache key
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
                    response_serializer = SafetyKPISummarySerializer(cached_result)
                    return Response(response_serializer.data)
            
            # Compute all safety KPIs
            results = SafetyEventKPIService.compute_all_safety_kpis(
                from_time=from_time,
                to_time=to_time,
                zone=zone,
                close_call_params=close_call_params,
                overspeed_params=overspeed_params
            )
            
            # Add cache metadata
            results['cache_metadata'] = {
                'cached': True,
                'cache_key': cache_key,
                'served_from_cache': False
            }
            
            # Cache the results
            cache_timeout = get_cache_timeout(time_bucket)
            cache.set(cache_key, results, timeout=cache_timeout)
            
            # Serialize response
            response_serializer = SafetyKPISummarySerializer(results)
            
            return Response(response_serializer.data)
            
        except ValueError as e:
            return Response(
                {'error': f'Invalid parameter format: {str(e)}'},
                status=status.HTTP_400_BAD_REQUEST
            )
        except Exception as e:
            return Response(
                {'error': f'Safety KPI computation failed: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )