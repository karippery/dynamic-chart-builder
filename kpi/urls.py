from django.urls import path
from kpi.views.close_call_views import (
    CloseCallKPIView, 
)
from kpi.views.safety_event_views import OverspeedEventsView, VestViolationsView
from kpi.views.v2.safety_violation_views_v2 import SafetyViolationOverviewViewV2
from .views.v2.close_call_views_v2 import CloseCallKPIViewV2
from .views.aggregation_views import AggregationView
from .views.v2.aggregation_views_v2 import AggregationViewV2, DashboardMetricsView, LatestDetectionsView


urlpatterns = [
    path('aggregate/', AggregationView.as_view(), name='aggregate'),

    # Close-call endpoints
    path('close-calls/', CloseCallKPIView.as_view(), name='close-call-kpi'),
    
    # Separate safety event endpoints
    path('overspeed-events/', OverspeedEventsView.as_view(), name='overspeed-events'),
    path('vest-violations/', VestViolationsView.as_view(), name='vest-violations'),

    path('v2/aggregate/', AggregationViewV2.as_view(), name='aggregate-v2'),
    path('v2/dashboard-metrics/', DashboardMetricsView.as_view(), name='dashboard-metrics-v2'),
    path('v2/latest-detections/', LatestDetectionsView.as_view(), name='latest-detections-v2'),
    path('v2/close-calls/', CloseCallKPIViewV2.as_view(), name='close-calls-v2'),
    path('v2/safety-violations/', SafetyViolationOverviewViewV2.as_view(), name='safety-violations-overview')

]