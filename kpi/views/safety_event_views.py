from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from django.core.cache import cache
from django.utils import timezone
from django.db.models import Count
from drf_spectacular.utils import extend_schema, OpenApiParameter

from config.cache_utils import generate_cache_key, get_cache_timeout
from kpi.common.pagination import DefaultPagination
from kpi.serializers.close_call_serializers import OverspeedEventRequestSerializer, OverspeedEventsResponseSerializer, VestViolationRequestSerializer, VestViolationsResponseSerializer


class OverspeedEventsView(APIView):
    """
    API endpoint for overspeed events with filtering and pagination.
    """
    
    @extend_schema(
        parameters=[
            OpenApiParameter(
                name='from_time',
                description='Start time for detection period (ISO 8601)',
                type=str
            ),
            OpenApiParameter(
                name='to_time',
                description='End time for detection period (ISO 8601)',
                type=str
            ),
            OpenApiParameter(
                name='zone',
                description='Filter by specific zone',
                type=str
            ),
            OpenApiParameter(
                name='speed_threshold',
                description='Overspeed threshold in m/s',
                type=float,
                default=1.5
            ),
            OpenApiParameter(
                name='include_humans',
                description='Include humans in overspeed monitoring',
                type=bool,
                default=False
            ),
            OpenApiParameter(
                name='object_class',
                description='Filter by specific object class',
                type=str,
                enum=['VEHICLE', 'PALLET_TRUCK', 'AGV', 'HUMAN']
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
        responses=OverspeedEventsResponseSerializer
    )
    def get(self, request):
        """
        Get overspeed events with filtering and pagination.
        """
        try:
            # Validate request parameters
            serializer = OverspeedEventRequestSerializer(data=request.GET)
            if not serializer.is_valid():
                return Response(
                    {'error': 'Invalid parameters', 'details': serializer.errors},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            validated_data = serializer.validated_data
            
            # Extract parameters
            from_time = validated_data.get('from_time')
            to_time = validated_data.get('to_time')
            zone = validated_data.get('zone')
            speed_threshold = validated_data.get('speed_threshold', 1.5)
            include_humans = validated_data.get('include_humans', False)
            object_class = validated_data.get('object_class')
            page = validated_data.get('page', 1)
            page_size = validated_data.get('page_size', 10)
            time_bucket = request.GET.get('time_bucket', '1h')
            force_refresh = request.GET.get('force_refresh', 'false').lower() == 'true'
            
            # Create parameters dict for cache key generation
            cache_params = {
                'from_time': from_time,
                'to_time': to_time,
                'zone': zone,
                'speed_threshold': speed_threshold,
                'include_humans': include_humans,
                'object_class': object_class,
                'page': page,
                'page_size': page_size,
                'endpoint': 'overspeed_events'
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
                    response_serializer = OverspeedEventsResponseSerializer(cached_result)
                    return Response(response_serializer.data)
            
            # Compute overspeed events using the service
            overspeed_params = {
                'speed_threshold': speed_threshold,
                'include_humans': include_humans,
                'object_class': object_class
            }
            
            # Get the base queryset
            from kpi.filters import get_overspeed_detections_with_derived_speed
            qs = get_overspeed_detections_with_derived_speed(
                from_time=from_time,
                to_time=to_time,
                zone=zone,
                **overspeed_params
            )
            
            # Get aggregated data
            total_count = qs.count()
            by_object_class = list(qs.values('object_class').annotate(count=Count('id')))
            
            # Apply pagination to get detailed events
            paginator = DefaultPagination()
            paginator.page_size = page_size
            paginated_qs = paginator.paginate_queryset(qs.order_by('-timestamp'), request)
            
            # Prepare detailed events
            detailed_events = []
            for detection in paginated_qs:
                # Calculate derived speed if needed
                derived_speed = None
                if detection.speed is None or detection.speed == 0:
                    from kpi.filters import derive_speed_for_object
                    derived_speed = derive_speed_for_object(
                        detection.tracking_id, from_time, to_time
                    )
                
                detailed_events.append({
                    'id': detection.id,
                    'timestamp': detection.timestamp,
                    'tracking_id': detection.tracking_id,
                    'object_class': detection.object_class,
                    'speed': detection.speed,
                    'derived_speed': derived_speed,
                    'x': detection.x,
                    'y': detection.y,
                    'zone': detection.zone,
                    'speed_threshold': speed_threshold
                })
            
            # Build response
            results = {
                'total_count': total_count,
                'speed_threshold': speed_threshold,
                'parameters_used': {
                    'from_time': from_time,
                    'to_time': to_time,
                    'zone': zone,
                    'speed_threshold': speed_threshold,
                    'include_humans': include_humans,
                    'object_class': object_class
                },
                'by_object_class': by_object_class,
                'statistics': {
                    'detections_processed': total_count,
                    'computation_time': timezone.now().isoformat()
                },
                'overspeed_events': detailed_events,
                'computed_at': timezone.now(),
                'pagination': paginator.get_paginated_dict(detailed_events) if paginated_qs is not None else None
            }
            
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
            response_serializer = OverspeedEventsResponseSerializer(results)
            
            return Response(response_serializer.data)
            
        except ValueError as e:
            return Response(
                {'error': f'Invalid parameter format: {str(e)}'},
                status=status.HTTP_400_BAD_REQUEST
            )
        except Exception as e:
            return Response(
                {'error': f'Overspeed events computation failed: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class VestViolationsView(APIView):
    """
    API endpoint for vest violations with filtering and pagination.
    """
    
    @extend_schema(
        parameters=[
            OpenApiParameter(
                name='from_time',
                description='Start time for detection period (ISO 8601)',
                type=str
            ),
            OpenApiParameter(
                name='to_time',
                description='End time for detection period (ISO 8601)',
                type=str
            ),
            OpenApiParameter(
                name='zone',
                description='Filter by specific zone',
                type=str
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
        responses=VestViolationsResponseSerializer
    )
    def get(self, request):
        """
        Get vest violations with filtering and pagination.
        """
        try:
            # Validate request parameters
            serializer = VestViolationRequestSerializer(data=request.GET)
            if not serializer.is_valid():
                return Response(
                    {'error': 'Invalid parameters', 'details': serializer.errors},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            validated_data = serializer.validated_data
            
            # Extract parameters
            from_time = validated_data.get('from_time')
            to_time = validated_data.get('to_time')
            zone = validated_data.get('zone')
            page = validated_data.get('page', 1)
            page_size = validated_data.get('page_size', 10)
            time_bucket = request.GET.get('time_bucket', '1h')
            force_refresh = request.GET.get('force_refresh', 'false').lower() == 'true'
            
            # Create parameters dict for cache key generation
            cache_params = {
                'from_time': from_time,
                'to_time': to_time,
                'zone': zone,
                'page': page,
                'page_size': page_size,
                'endpoint': 'vest_violations'
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
                    response_serializer = VestViolationsResponseSerializer(cached_result)
                    return Response(response_serializer.data)
            
            # Get vest violations using the service
            from kpi.filters import get_vest_violations
            qs = get_vest_violations(
                from_time=from_time,
                to_time=to_time,
                zone=zone
            )
            
            # Get total count for all violations
            total_count = qs.count()
            
            # Apply pagination to get detailed violations for current page
            paginator = DefaultPagination()
            paginator.page_size = page_size
            paginated_qs = paginator.paginate_queryset(qs.order_by('-timestamp'), request)
            
            # Prepare detailed violations for current page
            detailed_violations = []
            current_page_zones = set()  # Track zones in current page
            
            for detection in (paginated_qs or []):
                zone_value = detection.zone or 'unknown'
                current_page_zones.add(zone_value)
                
                detailed_violations.append({
                    'id': detection.id,
                    'timestamp': detection.timestamp,
                    'tracking_id': detection.tracking_id,
                    'x': detection.x,
                    'y': detection.y,
                    'zone': zone_value
                })
            
            # Calculate by_zone aggregation for CURRENT PAGE ONLY
            zones_in_current_page = {}
            for violation in detailed_violations:
                zone_key = violation['zone']
                if zone_key not in zones_in_current_page:
                    zones_in_current_page[zone_key] = 0
                zones_in_current_page[zone_key] += 1
            
            # Convert to the required format and sort by count descending
            by_zone_current_page = [
                {'zone': zone, 'count': count} 
                for zone, count in zones_in_current_page.items()
            ]
            by_zone_current_page.sort(key=lambda x: x['count'], reverse=True)
            
            # Get full zone aggregation for reference (optional)
            by_zone_full = list(qs.values('zone').annotate(count=Count('id')).order_by('-count'))
            
            # Build response
            results = {
                'total_count': total_count,
                'parameters_used': {
                    'from_time': from_time,
                    'to_time': to_time,
                    'zone': zone,
                    'page': page,
                    'page_size': page_size
                },
                # 'by_zone_full': by_zone_full,  # Full dataset zone aggregation
                'by_zone': by_zone_current_page,  # Current page zone aggregation
                'statistics': {
                    'detections_processed': total_count,
                    'computation_time': timezone.now().isoformat(),
                    'total_zones_count': len(by_zone_full),
                    'page_zones_count': len(by_zone_current_page),
                    'page_violations_count': len(detailed_violations),
                    'current_page_zones': list(current_page_zones)
                },
                'vest_violations': detailed_violations,
                'computed_at': timezone.now(),
                'pagination': paginator.get_paginated_dict(detailed_violations) if paginated_qs is not None else None
            }
            
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
            response_serializer = VestViolationsResponseSerializer(results)
            
            return Response(response_serializer.data)
            
        except ValueError as e:
            return Response(
                {'error': f'Invalid parameter format: {str(e)}'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        except Exception as e:
            return Response(
                {'error': f'Vest violations computation failed: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )