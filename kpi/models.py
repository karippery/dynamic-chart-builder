from django.db import models
from django.core.validators import MinValueValidator


class Detection(models.Model):
    """
    Represents a detection event from industrial tracking data.
    
    This model stores object detection events with spatial, temporal, 
    and classification information for KPI calculations.
    """
    
    class ObjectClass(models.TextChoices):
        """Valid object classification types."""
        HUMAN = 'human', 'Human'
        VEHICLE = 'vehicle', 'Vehicle'
        PALLET_TRUCK = 'pallet_truck', 'Pallet Truck'
        AGV = 'agv', 'AGV'

    tracking_id = models.CharField(
        max_length=100,
        unique=True,
        db_index=True,
        help_text="Unique tracking ID per object trajectory from CSV 'id' column."
    )
    
    object_class = models.CharField(
        max_length=20,
        choices=ObjectClass.choices,
        db_index=True,
        help_text="Object classification from CSV 'type' column."
    )
    
    timestamp = models.DateTimeField(
        db_index=True,
        help_text="Detection timestamp from CSV 'timestamp' column (ISO 8601 UTC)."
    )
    
    x = models.FloatField(help_text="Local X coordinate in meters.")
    y = models.FloatField(help_text="Local Y coordinate in meters.")
    
    heading = models.FloatField(
        null=True,
        blank=True,
        help_text="Heading angle in degrees (0–360). Null if unavailable."
    )
    
    vest = models.BooleanField(
        null=True,
        blank=True,
        help_text="Safety vest status from CSV 'vest' column. Only meaningful for humans."
    )
    
    speed = models.FloatField(
        null=True,
        blank=True,
        help_text="Instantaneous speed in m/s from CSV 'speed' column."
    )
    
    zone = models.CharField(
        max_length=50,
        null=True,
        blank=True,
        db_index=True,
        help_text="Zone identifier from CSV 'area' column."
    )

    class Meta:
        """Model metadata configuration."""
        ordering = ("timestamp",)
        indexes = [
            models.Index(fields=["object_class", "timestamp"]),
            models.Index(fields=["zone", "timestamp"]),
            models.Index(fields=["vest", "timestamp"]),
            models.Index(fields=["timestamp", "object_class"]),
            models.Index(fields=['x', 'y']),
        ]

    def __str__(self) -> str:
        """String representation of the detection."""
        return f"{self.object_class} ({self.tracking_id}) in zone {self.zone} at {self.timestamp}"

    @property
    def coordinates(self) -> tuple[float, float]:
        """Convenience property for coordinate pair."""
        return (self.x, self.y)
    
class CloseCallEvent(models.Model):
    """
    Records close-call safety events between humans and vehicles.
    """
    timestamp = models.DateTimeField(db_index=True, help_text="Time when close call occurred")
    detected_at = models.DateTimeField(auto_now_add=True, help_text="Time when close call was detected")
    
    # Human involved in close call
    human_tracking_id = models.CharField(max_length=100, db_index=True)
    human_x = models.FloatField(help_text="Human X coordinate")
    human_y = models.FloatField(help_text="Human Y coordinate")
    human_zone = models.CharField(max_length=50, null=True, blank=True)
    
    # Vehicle involved in close call
    vehicle_tracking_id = models.CharField(max_length=100, db_index=True)
    vehicle_class = models.CharField(
        max_length=20, 
        choices=Detection.ObjectClass.choices,
        help_text="Type of vehicle involved"
    )
    vehicle_x = models.FloatField(help_text="Vehicle X coordinate")
    vehicle_y = models.FloatField(help_text="Vehicle Y coordinate")
    vehicle_zone = models.CharField(max_length=50, null=True, blank=True)
    
    # Close call details
    distance = models.FloatField(
        validators=[MinValueValidator(0.0)],
        help_text="Distance between human and vehicle in meters"
    )
    distance_threshold = models.FloatField(
        default=2.0,
        validators=[MinValueValidator(0.1)],
        help_text="Distance threshold used for detection"
    )
    time_window_ms = models.IntegerField(
        default=250,
        validators=[MinValueValidator(50)],
        help_text="Time synchronization window in milliseconds"
    )
    
    # Metadata
    is_resolved = models.BooleanField(default=False)
    resolved_at = models.DateTimeField(null=True, blank=True)
    resolution_notes = models.TextField(blank=True)

    class Meta:
        indexes = [
            models.Index(fields=['timestamp']),
            models.Index(fields=['human_tracking_id', 'vehicle_tracking_id']),
            models.Index(fields=['vehicle_class']),
            models.Index(fields=['distance']),
        ]
        ordering = ['-timestamp']
        verbose_name = "Close Call Event"
        verbose_name_plural = "Close Call Events"

    def __str__(self):
        return f"Close call: Human {self.human_tracking_id} - {self.vehicle_class} {self.vehicle_tracking_id} at {self.timestamp}"

    @property
    def severity_level(self) -> str:
        """Calculate severity based on distance."""
        if self.distance < 1.0:
            return "HIGH"
        elif self.distance < 1.5:
            return "MEDIUM"
        else:
            return "LOW"
        