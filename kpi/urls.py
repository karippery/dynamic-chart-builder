from django.urls import path
from .views import AggregationView

urlpatterns = [
    path('aggregate/', AggregationView.as_view(), name='aggregate'),
]