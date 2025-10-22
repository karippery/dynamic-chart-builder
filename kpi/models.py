from django.db import models


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
        ]

    def __str__(self) -> str:
        """String representation of the detection."""
        return f"{self.object_class} ({self.tracking_id}) in zone {self.zone} at {self.timestamp}"

    @property
    def coordinates(self) -> tuple[float, float]:
        """Convenience property for coordinate pair."""
        return (self.x, self.y)