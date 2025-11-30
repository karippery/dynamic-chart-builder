# kpi/services/safety_violation_service.py
from datetime import timedelta
from typing import Dict, List, Any, Optional
from collections import defaultdict
import statistics
from django.utils import timezone
from django.db.models import Count, Avg, Max, Min, Q
from django.db import models

from kpi.common import kpi_filters


class SafetyViolationService:
    """
    Comprehensive safety violation detection and KPI calculation
    for vest violations and overspeed events.
    """
    
    def __init__(
        self,
        from_time: Optional[timezone.datetime] = None,
        to_time: Optional[timezone.datetime] = None,
        zone: Optional[str] = None,
        speed_threshold: float = 1.5,
        include_humans_in_speed: bool = False,
    ):
        self.from_time = kpi_filters.parse_if_str(from_time)
        self.to_time = kpi_filters.parse_if_str(to_time)
        self.zone = zone
        self.speed_threshold = float(speed_threshold)
        self.include_humans_in_speed = include_humans_in_speed

        # Statistics tracking
        self.stats = {
            "vest_violations_detected": 0,
            "overspeed_events_detected": 0,
            "unique_humans_with_violations": 0,
            "unique_vehicles_overspeeding": 0,
            "computation_time_ms": 0,
        }

    def compute_comprehensive_safety_kpis(self) -> Dict[str, Any]:
        """
        Compute comprehensive safety violation KPIs for dashboard
        """
        import time
        start_time = time.time()

        # Get both types of violations
        vest_violations = self._compute_vest_violations()
        overspeed_events = self._compute_overspeed_events()
        
        # Calculate comprehensive KPIs
        kpis = {
            # Top Cards Data
            "top_cards": self._compute_top_cards(vest_violations, overspeed_events),
            
            # Detailed Data
            "vest_violations": vest_violations,
            "overspeed_events": overspeed_events,
            
            # Time Series Data
            "time_series": self._compute_time_series(vest_violations, overspeed_events),
            
            # Zone Analysis
            "zone_analysis": self._compute_zone_analysis(vest_violations, overspeed_events),
            
            # Repeat Offenders
            "repeat_offenders": self._compute_repeat_offenders(vest_violations, overspeed_events),
            
            # Statistics
            "statistics": self.stats.copy(),
            "parameters_used": {
                "from_time": self.from_time.isoformat() if self.from_time else None,
                "to_time": self.to_time.isoformat() if self.to_time else None,
                "zone": self.zone,
                "speed_threshold": self.speed_threshold,
                "include_humans_in_speed": self.include_humans_in_speed,
            }
        }

        self.stats["computation_time_ms"] = round((time.time() - start_time) * 1000, 2)
        kpis["statistics"] = self.stats
        
        return kpis

    def _compute_vest_violations(self) -> List[Dict]:
        """Compute vest violations for humans"""
        from kpi.common.kpi_filters import get_human_detections
        
        # Get humans without vests
        human_qs = get_human_detections(self.from_time, self.to_time, self.zone)
        vest_violations_qs = human_qs.filter(vest=False)
        
        violations = list(vest_violations_qs.values(
            'id', 'timestamp', 'tracking_id', 'x', 'y', 'zone'
        ))
        
        self.stats["vest_violations_detected"] = len(violations)
        self.stats["unique_humans_with_violations"] = len(set(v['tracking_id'] for v in violations))
        
        return violations

    def _compute_overspeed_events(self) -> List[Dict]:
        """Compute overspeed events for vehicles (and optionally humans)"""
        from kpi.common.kpi_filters import get_detections_by_class
        
        # Determine which classes to include
        object_classes = ['vehicle', 'pallet_truck', 'agv']
        if self.include_humans_in_speed:
            object_classes.append('human')
        
        # Get detections with speed data
        detections_qs = get_detections_by_class(
            object_classes, self.from_time, self.to_time, self.zone
        )
        
        # Filter for overspeed events
        overspeed_qs = detections_qs.filter(speed__gt=self.speed_threshold)
        
        events = list(overspeed_qs.values(
            'id', 'timestamp', 'tracking_id', 'object_class', 
            'speed', 'x', 'y', 'zone'
        ))
        
        self.stats["overspeed_events_detected"] = len(events)
        self.stats["unique_vehicles_overspeeding"] = len(set(
            e['tracking_id'] for e in events if e['object_class'] != 'human'
        ))
        
        return events

    def _compute_top_cards(self, vest_violations: List[Dict], overspeed_events: List[Dict]) -> Dict[str, Any]:
        """Compute the top cards metrics for the dashboard"""
        
        # Vest violations calculations
        vest_count = len(vest_violations)
        unique_humans_violations = len(set(v['tracking_id'] for v in vest_violations))
        
        # Calculate vest compliance percentage
        from kpi.common.kpi_filters import get_human_detections
        all_humans_qs = get_human_detections(self.from_time, self.to_time, self.zone)
        total_human_detections = all_humans_qs.count()
        
        if total_human_detections > 0:
            vest_compliance_percentage = round(
                (1 - (vest_count / total_human_detections)) * 100, 1
            )
        else:
            vest_compliance_percentage = 100.0
        
        # Overspeed calculations
        overspeed_count = len(overspeed_events)
        unique_vehicles_overspeeding = len(set(
            e['tracking_id'] for e in overspeed_events if e['object_class'] != 'human'
        ))
        
        # Calculate average overspeed excess
        speed_excesses = [
            e['speed'] - self.speed_threshold for e in overspeed_events 
            if e.get('speed') is not None
        ]
        avg_overspeed_excess = round(statistics.mean(speed_excesses), 2) if speed_excesses else 0
        
        return {
            "vest_violations_count": vest_count,
            "vest_violations_unique_humans": unique_humans_violations,
            "overspeed_events_count": overspeed_count,
            "overspeed_events_unique_vehicles": unique_vehicles_overspeeding,
            "vest_compliance_percentage": vest_compliance_percentage,
            "avg_overspeed_excess": avg_overspeed_excess,
        }

    def _compute_time_series(self, vest_violations: List[Dict], overspeed_events: List[Dict]) -> List[Dict]:
        """Compute time series data for both violation types"""
        from collections import defaultdict
        
        # Group by hour
        vest_by_hour = defaultdict(int)
        speed_by_hour = defaultdict(int)
        
        for violation in vest_violations:
            hour_key = violation['timestamp'].strftime('%Y-%m-%d %H:00')
            vest_by_hour[hour_key] += 1
            
        for event in overspeed_events:
            hour_key = event['timestamp'].strftime('%Y-%m-%d %H:00')
            speed_by_hour[hour_key] += 1
        
        # Combine into time series
        all_hours = set(list(vest_by_hour.keys()) + list(speed_by_hour.keys()))
        time_series = []
        
        for hour in sorted(all_hours):
            time_series.append({
                "hour": hour,
                "vest_violations": vest_by_hour.get(hour, 0),
                "overspeed_events": speed_by_hour.get(hour, 0),
            })
        
        return time_series

    def _compute_zone_analysis(self, vest_violations: List[Dict], overspeed_events: List[Dict]) -> Dict[str, Any]:
        """Analyze violations by zone"""
        from collections import defaultdict
        
        vest_by_zone = defaultdict(int)
        speed_by_zone = defaultdict(int)
        
        for violation in vest_violations:
            zone = violation.get('zone') or 'unknown'
            vest_by_zone[zone] += 1
            
        for event in overspeed_events:
            zone = event.get('zone') or 'unknown'
            speed_by_zone[zone] += 1
        
        # Combine zones
        all_zones = set(list(vest_by_zone.keys()) + list(speed_by_zone.keys()))
        zone_analysis = []
        
        for zone in sorted(all_zones):
            zone_analysis.append({
                "zone": zone,
                "vest_violations": vest_by_zone.get(zone, 0),
                "overspeed_events": speed_by_zone.get(zone, 0),
                "total_violations": vest_by_zone.get(zone, 0) + speed_by_zone.get(zone, 0),
            })
        
        # Sort by total violations
        zone_analysis.sort(key=lambda x: x["total_violations"], reverse=True)
        
        return {
            "by_zone": zone_analysis,
            "worst_zone_vest": max(vest_by_zone.items(), key=lambda x: x[1])[0] if vest_by_zone else None,
            "worst_zone_speed": max(speed_by_zone.items(), key=lambda x: x[1])[0] if speed_by_zone else None,
        }

    def _compute_repeat_offenders(self, vest_violations: List[Dict], overspeed_events: List[Dict]) -> Dict[str, List]:
        """Identify repeat offenders for both violation types"""
        from collections import defaultdict
        
        # Vest violation offenders
        vest_offenders = defaultdict(int)
        for violation in vest_violations:
            vest_offenders[violation['tracking_id']] += 1
        
        # Overspeed offenders
        speed_offenders = defaultdict(int)
        speed_excess = defaultdict(list)
        
        for event in overspeed_events:
            tracking_id = event['tracking_id']
            speed_offenders[tracking_id] += 1
            if event.get('speed') is not None:
                speed_excess[tracking_id].append(event['speed'] - self.speed_threshold)
        
        # Prepare vest offenders list
        vest_repeaters = []
        for tracking_id, count in vest_offenders.items():
            if count >= 2:  # Consider repeat if 2+ violations
                vest_repeaters.append({
                    "id": tracking_id,
                    "type": "vest_violation",
                    "total_events": count,
                    "rate_per_hour": self._calculate_rate_per_hour(count),
                    "avg_excess": 0,  # Not applicable for vest violations
                })
        
        # Prepare speed offenders list
        speed_repeaters = []
        for tracking_id, count in speed_offenders.items():
            if count >= 2:  # Consider repeat if 2+ violations
                avg_excess = round(statistics.mean(speed_excess[tracking_id]), 2) if speed_excess[tracking_id] else 0
                speed_repeaters.append({
                    "id": tracking_id,
                    "type": "overspeed",
                    "total_events": count,
                    "rate_per_hour": self._calculate_rate_per_hour(count),
                    "avg_excess": avg_excess,
                })
        
        # Combine and sort
        all_repeaters = vest_repeaters + speed_repeaters
        all_repeaters.sort(key=lambda x: x["total_events"], reverse=True)
        
        return {
            "all_offenders": all_repeaters[:20],  # Top 20
            "vest_offenders": vest_repeaters[:10],  # Top 10 vest
            "speed_offenders": speed_repeaters[:10],  # Top 10 speed
        }

    def _calculate_rate_per_hour(self, event_count: int) -> float:
        """Calculate rate per hour based on time range"""
        if self.from_time and self.to_time:
            hours = (self.to_time - self.from_time).total_seconds() / 3600
            if hours > 0:
                return round(event_count / hours, 2)
        return round(event_count, 2)  # Fallback to count if no time range