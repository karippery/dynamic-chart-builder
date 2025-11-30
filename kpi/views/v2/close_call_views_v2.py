# kpi/views/close_call_views.py
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from drf_spectacular.utils import extend_schema, OpenApiParameter
from django.utils import timezone

from kpi.serializers.close_call_serializers_v2 import (
    CloseCallDetectionRequestSerializer,  # Add this import
    CloseCallKPIResponseSerializer
)
from kpi.services.close_call_service_v2 import CloseCallKPIServiceV2


class CloseCallKPIViewV2(APIView):
    """
    Enhanced API for close-call KPIs with near-miss intelligence
    """

        
    # List of parameters that the service accepts
    SERVICE_PARAMS = [
        'distance_threshold', 
        'time_window_ms', 
        'from_time', 
        'to_time', 
        'zone', 
        'object_class'
    ]
    
    @extend_schema(
        tags=['V2'],
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
                name='include_kpis',
                description='Include comprehensive KPI calculations',
                type=bool,
                default=True
            ),
        ],
        responses=CloseCallKPIResponseSerializer
    )
    def get(self, request):
        """Get comprehensive close-call KPIs"""
        # Use the REQUEST serializer for query parameters
        serializer = CloseCallDetectionRequestSerializer(data=request.query_params)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        try:
            params = serializer.validated_data.copy()
            
            # Extract view-specific parameters
            include_details = params.pop('include_details', True)
            include_kpis = params.pop('include_kpis', True)
            
            # Filter parameters to only those accepted by the service
            service_params = {k: v for k, v in params.items() if k in self.SERVICE_PARAMS}
            
            # Initialize service with filtered parameters
            service = CloseCallKPIServiceV2(**service_params)
            
            # Compute KPIs based on request
            if include_kpis:
                results = service.compute_comprehensive_kpis()
            else:
                # Only compute basic close calls without detailed KPIs
                close_calls = service._compute_close_calls()
                results = {
                    "total_count": len(close_calls),
                    "close_calls": close_calls,
                    "time_series": service._compute_time_series(close_calls),
                    "statistics": service.stats.copy(),
                }
            
            # Handle include_details parameter
            if not include_details:
                results.pop('close_calls', None)
            
            # Add metadata
            results["computed_at"] = timezone.now().isoformat()
            results["include_details"] = include_details
            results["include_kpis"] = include_kpis
            results["parameters_used"] = service_params
            
            # Use the RESPONSE serializer for the output
            response_serializer = CloseCallKPIResponseSerializer(results)
            return Response(response_serializer.data)
            
        except Exception as e:
            return Response(
                {"error": f"Close-call KPI computation failed: {str(e)}"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )