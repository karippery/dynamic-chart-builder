import math
from bisect import bisect_left, bisect_right
from datetime import timedelta
from typing import Any, Dict, List, Optional

from django.db.models import Count
from django.utils import timezone
from kpi import filters as kpi_filters


# ------- Close-call KPI ------- #
class CloseCallKPI:
    HUMAN_FIELDS = ("id", "timestamp", "x", "y", "tracking_id", "zone")
    VEHICLE_FIELDS = ("id", "timestamp", "x", "y", "tracking_id", "zone", "object_class")

    def __init__(
        self,
        distance_threshold: float = 2.0,
        time_window_ms: int = 250,
        from_time: Optional[timezone.datetime] = None,
        to_time: Optional[timezone.datetime] = None,
        zone: Optional[str] = None,
        vehicle_class: Optional[str] = None,
        batch_size: int = 200,
    ):
        self.distance_threshold = float(distance_threshold)
        self.time_window_ms = int(time_window_ms)
        self.time_window = timedelta(milliseconds=self.time_window_ms)
        self.from_time = kpi_filters.parse_if_str(from_time)
        self.to_time = kpi_filters.parse_if_str(to_time)
        self.zone = zone
        self.vehicle_class = vehicle_class
        self.batch_size = int(batch_size)

        self.stats = {
            "human_detections_processed": 0,
            "vehicle_detections_processed": 0,
            "close_calls_detected": 0,
            "time_window_used_ms": self.time_window_ms,
        }

    def compute_close_calls(self) -> Dict[str, Any]:
        results = {
            "total_count": 0,
            "close_calls": [],
            "by_vehicle_class": {},
            "by_severity": {"HIGH": 0, "MEDIUM": 0, "LOW": 0},
            "time_series": [],
            "statistics": self.stats.copy(),
        }

        human_qs = kpi_filters.get_human_detections(self.from_time, self.to_time, self.zone).order_by("timestamp")
        human_rows = list(human_qs.values(*self.HUMAN_FIELDS))
        self.stats["human_detections_processed"] = len(human_rows)
        if not human_rows:
            return results

        min_ts = human_rows[0]["timestamp"] - self.time_window
        max_ts = human_rows[-1]["timestamp"] + self.time_window

        vehicle_qs = kpi_filters.get_vehicle_detections_in_range(min_ts, max_ts, self.zone, self.vehicle_class).order_by("timestamp")
        vehicle_rows = list(vehicle_qs.values(*self.VEHICLE_FIELDS))
        self.stats["vehicle_detections_processed"] = len(vehicle_rows)
        if not vehicle_rows:
            return results

        vehicle_ts_ms = [int(v["timestamp"].timestamp() * 1000) for v in vehicle_rows]
        all_close_calls = []

        for start in range(0, len(human_rows), self.batch_size):
            batch = human_rows[start : start + self.batch_size]
            all_close_calls.extend(self._process_human_batch(batch, vehicle_rows, vehicle_ts_ms))

        results["total_count"] = len(all_close_calls)
        results["close_calls"] = all_close_calls
        results["statistics"]["close_calls_detected"] = len(all_close_calls)
        self._aggregate_results(all_close_calls, results)
        return results

    def _process_human_batch(self, human_batch, vehicle_rows, vehicle_ts_ms):
        if not human_batch:
            return []

        win = self.time_window_ms
        d_thresh_sq = self.distance_threshold ** 2
        close_calls = []

        for h in human_batch:
            ht = int(h["timestamp"].timestamp() * 1000)
            left = bisect_left(vehicle_ts_ms, ht - win)
            right = bisect_right(vehicle_ts_ms, ht + win)
            if left >= right:
                continue

            hx, hy = float(h["x"]), float(h["y"])
            for v in vehicle_rows[left:right]:
                vx, vy = float(v["x"]), float(v["y"])
                dx, dy = vx - hx, vy - hy
                if dx * dx + dy * dy <= d_thresh_sq:
                    dist = math.hypot(dx, dy)
                    close_calls.append(self._close_call_from_rows(h, v, dist))
        return close_calls

    def _close_call_from_rows(self, h, v, distance):
        diff_ms = abs((v["timestamp"] - h["timestamp"]).total_seconds() * 1000)
        severity = "HIGH" if distance < 1.0 else "MEDIUM" if distance < 1.5 else "LOW"
        return {
            "timestamp": h["timestamp"].isoformat(),
            "human_tracking_id": h.get("tracking_id"),
            "human_x": h.get("x"),
            "human_y": h.get("y"),
            "human_zone": h.get("zone"),
            "vehicle_tracking_id": v.get("tracking_id"),
            "vehicle_class": v.get("object_class"),
            "vehicle_x": v.get("x"),
            "vehicle_y": v.get("y"),
            "vehicle_zone": v.get("zone"),
            "distance": round(distance, 2),
            "distance_threshold": self.distance_threshold,
            "time_window_ms": self.time_window_ms,
            "time_difference_ms": round(diff_ms, 1),
            "severity": severity,
        }

    def _aggregate_results(self, close_calls, results):
        by_vehicle_class = {}
        by_severity = {"HIGH": 0, "MEDIUM": 0, "LOW": 0}
        for c in close_calls:
            by_vehicle_class[c["vehicle_class"]] = by_vehicle_class.get(c["vehicle_class"], 0) + 1
            by_severity[c["severity"]] += 1
        results["by_vehicle_class"] = by_vehicle_class
        results["by_severity"] = by_severity

        if close_calls:
            ts_counts = {}
            for c in close_calls:
                key = c["timestamp"][:16]
                ts_counts[key] = ts_counts.get(key, 0) + 1
            results["time_series"] = [{"time": t, "count": c} for t, c in sorted(ts_counts.items())]


# ------- Safety Event KPI Service ------- #
class SafetyEventKPIService:
    @staticmethod
    def compute_overspeed_events(**kwargs):
        qs = kpi_filters.get_overspeed_detections_with_derived_speed(**kwargs)
        total = qs.count()
        by_class = list(qs.values("object_class").annotate(count=Count("id")))
        return {
            "total_count": total,
            "speed_threshold": kwargs.get("speed_threshold"),
            "by_object_class": by_class,
            "statistics": {"detections_processed": total, "parameters_used": kwargs},
        }

    @staticmethod
    def compute_vest_violations(**kwargs):
        qs = kpi_filters.get_vest_violations(**kwargs)
        total = qs.count()
        by_zone = list(qs.values("zone").annotate(count=Count("id")))
        return {
            "total_count": total,
            "by_zone": by_zone,
            "statistics": {"detections_processed": total, "parameters_used": kwargs},
        }

    @staticmethod
    def compute_all_safety_kpis(from_time=None, to_time=None, zone=None, close_call_params=None, overspeed_params=None):
        close_call_params = close_call_params or {}
        overspeed_params = overspeed_params or {}

        close_calls = CloseCallKPI(from_time=from_time, to_time=to_time, zone=zone, **close_call_params).compute_close_calls()
        overspeed = SafetyEventKPIService.compute_overspeed_events(
            from_time=from_time, to_time=to_time, zone=zone, **overspeed_params
        )
        vest = SafetyEventKPIService.compute_vest_violations(from_time=from_time, to_time=to_time, zone=zone)

        return {
            "close_calls": close_calls,
            "overspeed_events": overspeed,
            "vest_violations": vest,
            "metadata": {
                "computed_at": timezone.now().isoformat(),
                "time_range": {"from": str(from_time), "to": str(to_time)},
                "zone": zone,
            },
        }
