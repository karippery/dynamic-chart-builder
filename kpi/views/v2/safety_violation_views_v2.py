# kpi/views/safety_violation_views.py
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from drf_spectacular.utils import extend_schema, OpenApiParameter
from django.utils import timezone

from kpi.serializers.safety_violation_serializers_v2 import SafetyViolationRequestSerializer, SafetyViolationResponseSerializer
from kpi.services.safety_violation_service import SafetyViolationService



class SafetyViolationOverviewViewV2(APIView):
    """
    Comprehensive safety violation overview with all KPIs for dashboard
    """
    
    @extend_schema(
        tags=['V2'],
        parameters=[
            OpenApiParameter(
                name='from_time',
                description='Start time for analysis period (ISO 8601)',
                type=str
            ),
            OpenApiParameter(
                name='to_time',
                description='End time for analysis period (ISO 8601)',
                type=str
            ),
            OpenApiParameter(
                name='zone',
                description='Filter by specific zone',
                type=str
            ),
            OpenApiParameter(
                name='speed_threshold',
                description='Speed threshold for overspeed detection (m/s)',
                type=float,
                default=1.5
            ),
            OpenApiParameter(
                name='include_humans_in_speed',
                description='Include humans in overspeed monitoring',
                type=bool,
                default=False
            ),
            OpenApiParameter(
                name='include_details',
                description='Include detailed violation records in response',
                type=bool,
                default=True
            ),
        ],
        responses=SafetyViolationResponseSerializer
    )
    def get(self, request):
        """Get comprehensive safety violation overview"""
        serializer = SafetyViolationRequestSerializer(data=request.query_params)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        try:
            params = serializer.validated_data.copy()
            include_details = params.pop('include_details', True)
            
            # Initialize service
            service = SafetyViolationService(**params)
            
            # Compute comprehensive KPIs
            results = service.compute_comprehensive_safety_kpis()
            
            # Handle include_details parameter
            if not include_details:
                results.pop('vest_violations', None)
                results.pop('overspeed_events', None)
            
            # Add metadata
            results["computed_at"] = timezone.now().isoformat()
            results["include_details"] = include_details
            
            response_serializer = SafetyViolationResponseSerializer(results)
            return Response(response_serializer.data)
            
        except Exception as e:
            return Response(
                {"error": f"Safety violation computation failed: {str(e)}"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )