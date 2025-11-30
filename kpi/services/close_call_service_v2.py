
import math
from bisect import bisect_left, bisect_right
from datetime import timedelta
from typing import Dict, List, Any, Optional
from collections import defaultdict
import statistics
from django.utils import timezone

from kpi.common import kpi_filters

class CloseCallKPIServiceV2:
    """
    Enhanced close-call detection with KPI calculations for near-miss intelligence
    """
    
    def __init__(
        self,
        distance_threshold: float = 2.0,
        time_window_ms: int = 250,
        from_time: Optional[timezone.datetime] = None,
        to_time: Optional[timezone.datetime] = None,
        zone: Optional[str] = None,
        object_class: Optional[str] = None,
        batch_size: int = 200,
    ):
        self.distance_threshold = float(distance_threshold)
        self.time_window_ms = int(time_window_ms)
        self.time_window = timedelta(milliseconds=self.time_window_ms)
        self.from_time = kpi_filters.parse_if_str(from_time)
        self.to_time = kpi_filters.parse_if_str(to_time)
        self.zone = zone
        self.vehicle_class = object_class
        self.batch_size = int(batch_size)

        # Statistics tracking
        self.stats = {
            "human_detections_processed": 0,
            "vehicle_detections_processed": 0,
            "close_calls_detected": 0,
            "computation_time_ms": 0,
        }

    def compute_comprehensive_kpis(self) -> Dict[str, Any]:
        """
        Compute all close-call KPIs including rate calculations and offender analysis
        """
        import time
        start_time = time.time()

        # Get base close calls
        close_calls = self._compute_close_calls()
        
        # Calculate KPIs
        kpis = {
            "total_count": len(close_calls), 
            "close_calls_count": len(close_calls),
            "close_calls": close_calls,
            "time_series": self._compute_time_series(close_calls),
            "top_offenders": self._compute_top_offenders(close_calls),
            "zone_analysis": self._compute_zone_analysis(close_calls),
            "near_miss_rate": self._compute_near_miss_rate(close_calls),
            "severity_analysis": self._compute_severity_analysis(close_calls),
            "statistics": self.stats.copy(),
            "parameters_used": {
                "distance_threshold": self.distance_threshold,
                "time_window_ms": self.time_window_ms,
                "from_time": self.from_time.isoformat() if self.from_time else None,
                "to_time": self.to_time.isoformat() if self.to_time else None,
                "zone": self.zone,
                "vehicle_class": self.vehicle_class,
            }
        }

        self.stats["computation_time_ms"] = round((time.time() - start_time) * 1000, 2)
        kpis["statistics"] = self.stats
        
        return kpis

    def _compute_close_calls(self) -> List[Dict]:
        """Compute close calls between humans and vehicles"""
        close_calls = []
        
        # Get human detections
        human_qs = kpi_filters.get_human_detections(
            self.from_time, self.to_time, self.zone
        ).order_by("timestamp")
        
        human_fields = ("id", "timestamp", "x", "y", "tracking_id", "zone")
        human_rows = list(human_qs.values(*human_fields))
        self.stats["human_detections_processed"] = len(human_rows)
        
        if not human_rows:
            return close_calls

        # Get vehicle detections in expanded time range
        min_ts = human_rows[0]["timestamp"] - self.time_window
        max_ts = human_rows[-1]["timestamp"] + self.time_window
        
        vehicle_qs = kpi_filters.get_vehicle_detections_in_range(
            min_ts, max_ts, self.zone, self.vehicle_class
        ).order_by("timestamp")
        
        vehicle_fields = ("id", "timestamp", "x", "y", "tracking_id", "zone", "object_class")
        vehicle_rows = list(vehicle_qs.values(*vehicle_fields))
        self.stats["vehicle_detections_processed"] = len(vehicle_rows)
        
        if not vehicle_rows:
            return close_calls

        # Convert timestamps to milliseconds for binary search
        vehicle_ts_ms = [int(v["timestamp"].timestamp() * 1000) for v in vehicle_rows]
        d_thresh_sq = self.distance_threshold ** 2

        # Process in batches
        for i in range(0, len(human_rows), self.batch_size):
            batch = human_rows[i:i + self.batch_size]
            close_calls.extend(self._process_human_batch(batch, vehicle_rows, vehicle_ts_ms, d_thresh_sq))

        self.stats["close_calls_detected"] = len(close_calls)
        return close_calls

    def _process_human_batch(self, human_batch, vehicle_rows, vehicle_ts_ms, d_thresh_sq):
        """Process a batch of human detections against all vehicles"""
        batch_close_calls = []
        win = self.time_window_ms

        for human in human_batch:
            ht_ms = int(human["timestamp"].timestamp() * 1000)
            
            # Find vehicles within time window using binary search
            left = bisect_left(vehicle_ts_ms, ht_ms - win)
            right = bisect_right(vehicle_ts_ms, ht_ms + win)
            
            if left >= right:
                continue

            hx, hy = float(human["x"]), float(human["y"])
            
            # Check distance for each vehicle in time window
            for vehicle in vehicle_rows[left:right]:
                vx, vy = float(vehicle["x"]), float(vehicle["y"])
                dx, dy = vx - hx, vy - hy
                
                if dx * dx + dy * dy <= d_thresh_sq:
                    distance = math.hypot(dx, dy)
                    close_call = self._create_close_call_record(human, vehicle, distance)
                    batch_close_calls.append(close_call)

        return batch_close_calls

    def _create_close_call_record(self, human, vehicle, distance):
        """Create a standardized close call record"""
        time_diff_ms = abs((vehicle["timestamp"] - human["timestamp"]).total_seconds() * 1000)
        
        # Determine severity based on distance
        if distance < 1.0:
            severity = "HIGH"
        elif distance < 1.5:
            severity = "MEDIUM"
        else:
            severity = "LOW"

        return {
            "timestamp": human["timestamp"].isoformat(),
            "human_tracking_id": human.get("tracking_id"),
            "human_zone": human.get("zone"),
            "vehicle_tracking_id": vehicle.get("tracking_id"),
            "vehicle_class": vehicle.get("object_class"),
            "vehicle_zone": vehicle.get("zone"),
            "distance": round(distance, 2),
            "time_difference_ms": round(time_diff_ms, 1),
            "severity": severity,
        }

    def _compute_time_series(self, close_calls: List[Dict]) -> List[Dict]:
        """Group close calls by time intervals"""
        if not close_calls:
            return []

        # Group by minute
        ts_counts = defaultdict(int)
        for cc in close_calls:
            # Truncate to minute
            minute_key = cc["timestamp"][:16]  # "YYYY-MM-DDTHH:MM"
            ts_counts[minute_key] += 1

        return [{"time": t, "count": c} for t, c in sorted(ts_counts.items())]

    def _compute_top_offenders(self, close_calls: List[Dict]) -> List[Dict]:
        """Identify top offenders by close call count"""
        if not close_calls:
            return []

        offender_counts = defaultdict(int)
        vehicle_exposure = defaultdict(int)  # Simple exposure metric
        
        for cc in close_calls:
            vehicle_id = cc["vehicle_tracking_id"]
            offender_counts[vehicle_id] += 1
            # Count unique minutes for exposure
            minute_key = cc["timestamp"][:16]
            vehicle_exposure[vehicle_id] = vehicle_exposure.get(vehicle_id, set())
            vehicle_exposure[vehicle_id].add(minute_key)

        # Convert to list and calculate rates
        offenders = []
        for vehicle_id, count in offender_counts.items():
            exposure_minutes = len(vehicle_exposure[vehicle_id])
            rate_per_minute = count / exposure_minutes if exposure_minutes > 0 else 0
            
            offenders.append({
                "vehicle_id": vehicle_id,
                "close_calls": count,
                "exposure_minutes": exposure_minutes,
                "rate_per_minute": round(rate_per_minute, 3),
            })

        return sorted(offenders, key=lambda x: x["close_calls"], reverse=True)[:10]

    def _compute_zone_analysis(self, close_calls: List[Dict]) -> Dict:
        """Analyze close calls by zone with density calculations"""
        if not close_calls:
            return {"worst_zone": None, "by_zone": {}}

        zone_counts = defaultdict(int)
        zone_density = defaultdict(list)
        
        for cc in close_calls:
            zone = cc.get("vehicle_zone") or cc.get("human_zone")
            if zone:
                zone_counts[zone] += 1
                zone_density[zone].append(cc["distance"])

        # Find worst zone by count
        worst_zone = max(zone_counts.items(), key=lambda x: x[1])[0] if zone_counts else None

        # Calculate zone statistics
        by_zone = {}
        for zone, counts in zone_counts.items():
            distances = zone_density[zone]
            by_zone[zone] = {
                "close_calls": counts,
                "avg_distance": round(statistics.mean(distances), 2) if distances else 0,
                "min_distance": round(min(distances), 2) if distances else 0,
                "max_distance": round(max(distances), 2) if distances else 0,
            }

        return {
            "worst_zone": worst_zone,
            "by_zone": by_zone,
        }

    def _compute_near_miss_rate(self, close_calls: List[Dict]) -> Dict:
        """Calculate near-miss rate per 100 vehicle-minutes"""
        if not close_calls:
            return {"rate_per_100_minutes": 0, "total_vehicle_minutes": 0}

        # Calculate total observation time in minutes
        if self.from_time and self.to_time:
            total_minutes = (self.to_time - self.from_time).total_seconds() / 60
        else:
            # Estimate from data range
            timestamps = [cc["timestamp"] for cc in close_calls]
            if timestamps:
                min_ts = min(timestamps)
                max_ts = max(timestamps)
                total_minutes = (timezone.datetime.fromisoformat(max_ts) - 
                               timezone.datetime.fromisoformat(min_ts)).total_seconds() / 60
            else:
                total_minutes = 60  # Default to 1 hour

        # Count unique vehicles
        unique_vehicles = len(set(cc["vehicle_tracking_id"] for cc in close_calls))
        
        # Vehicle-minutes = unique vehicles × observation minutes
        vehicle_minutes = unique_vehicles * total_minutes
        
        if vehicle_minutes > 0:
            rate_per_100 = (len(close_calls) / vehicle_minutes) * 100
        else:
            rate_per_100 = 0

        return {
            "rate_per_100_minutes": round(rate_per_100, 2),
            "total_vehicle_minutes": round(vehicle_minutes, 2),
            "unique_vehicles": unique_vehicles,
            "observation_minutes": round(total_minutes, 2),
        }

    def _compute_severity_analysis(self, close_calls: List[Dict]) -> Dict:
        """Analyze close calls by severity level"""
        severity_counts = defaultdict(int)
        severity_distances = defaultdict(list)
        
        for cc in close_calls:
            severity = cc["severity"]
            severity_counts[severity] += 1
            severity_distances[severity].append(cc["distance"])

        analysis = {}
        for severity in ["HIGH", "MEDIUM", "LOW"]:
            counts = severity_counts[severity]
            distances = severity_distances[severity]
            
            analysis[severity] = {
                "count": counts,
                "percentage": round((counts / len(close_calls)) * 100, 1) if close_calls else 0,
                "avg_distance": round(statistics.mean(distances), 2) if distances else 0,
            }

        return analysis