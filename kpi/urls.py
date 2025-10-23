from django.urls import path

from kpi.views.close_call_views import  CloseCallKPIView, SafetyKPIView
from .views.aggregation_views import AggregationView

urlpatterns = [
    path('aggregate/', AggregationView.as_view(), name='aggregate'),

    # Close-call endpoints
    path('close-calls/', CloseCallKPIView.as_view(), name='close-call-kpi'),
    path('safety/', SafetyKPIView.as_view(), name='safety-kpi'),
]