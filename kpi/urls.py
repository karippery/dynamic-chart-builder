from django.urls import path
from kpi.views.close_call_views import (
    CloseCallKPIView, 
)
from kpi.views.safety_event_views import OverspeedEventsView, VestViolationsView
from .views.aggregation_views import AggregationView

urlpatterns = [
    path('aggregate/', AggregationView.as_view(), name='aggregate'),

    # Close-call endpoints
    path('close-calls/', CloseCallKPIView.as_view(), name='close-call-kpi'),
    
    # Separate safety event endpoints
    path('overspeed-events/', OverspeedEventsView.as_view(), name='overspeed-events'),
    path('vest-violations/', VestViolationsView.as_view(), name='vest-violations'),
]