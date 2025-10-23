import math
from bisect import bisect_left, bisect_right
from datetime import timedelta
from typing import Any, Dict, List, Optional

from django.db.models import Count, Q
from django.utils import timezone
from django.utils.dateparse import parse_datetime

from kpi.models import Detection


# ------- Close-call KPI ------- #
class CloseCallKPI:
    """
    Compute close-call metrics (human <> vehicle proximity) in plain PostgreSQL.

    Optimizations and design choices:
    - Query only needed fields via .values() to reduce ORM overhead.
    - Fetch all vehicle candidates once for the full human time range.
    - Sort vehicle timestamps and use bisect to find vehicles within the time window.
    - Batch human rows for memory control.
    """

    VEHICLE_CLASSES = [
        Detection.ObjectClass.VEHICLE,
        Detection.ObjectClass.PALLET_TRUCK,
        Detection.ObjectClass.AGV,
    ]

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

        if from_time and isinstance(from_time, str):
            from_time = parse_datetime(from_time)
        if to_time and isinstance(to_time, str):
            to_time = parse_datetime(to_time)

        self.from_time = from_time
        self.to_time = to_time
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

        human_qs = self._get_human_qs().order_by("timestamp")
        human_rows = list(human_qs.values(*self.HUMAN_FIELDS))
        self.stats["human_detections_processed"] = len(human_rows)

        if not human_rows:
            return results

        # Determine vehicle fetch window once
        min_ts = human_rows[0]["timestamp"] - self.time_window
        max_ts = human_rows[-1]["timestamp"] + self.time_window

        vehicle_rows = self._get_vehicle_rows_in_range(min_ts, max_ts)
        self.stats["vehicle_detections_processed"] = len(vehicle_rows)

        if not vehicle_rows:
            return results

        # Precompute millisecond timestamps for bisect
        vehicle_ts_ms = [int(v["timestamp"].timestamp() * 1000) for v in vehicle_rows]

        all_close_calls: List[Dict[str, Any]] = []
        for start in range(0, len(human_rows), self.batch_size):
            batch = human_rows[start : start + self.batch_size]
            all_close_calls.extend(self._process_human_batch(batch, vehicle_rows, vehicle_ts_ms))

        results["total_count"] = len(all_close_calls)
        results["close_calls"] = all_close_calls
        results["statistics"]["close_calls_detected"] = len(all_close_calls)

        self._aggregate_results(all_close_calls, results)
        return results

    def _process_human_batch(
        self, human_batch: List[Dict[str, Any]], vehicle_rows: List[Dict[str, Any]], vehicle_ts_ms: List[int]
    ) -> List[Dict[str, Any]]:
        if not human_batch:
            return []

        win = self.time_window_ms
        d_thresh = self.distance_threshold
        d_thresh_sq = d_thresh * d_thresh  # compare squared distances first

        batch_close_calls: List[Dict[str, Any]] = []

        for h in human_batch:
            human_ts_ms = int(h["timestamp"].timestamp() * 1000)
            left = bisect_left(vehicle_ts_ms, human_ts_ms - win)
            right = bisect_right(vehicle_ts_ms, human_ts_ms + win)

            if left >= right:
                continue

            hx, hy = float(h["x"]), float(h["y"])

            for v in vehicle_rows[left:right]:
                vx, vy = float(v["x"]), float(v["y"])
                dx = vx - hx
                dy = vy - hy
                if dx * dx + dy * dy <= d_thresh_sq:
                    dist = math.hypot(dx, dy)
                    batch_close_calls.append(self._close_call_from_rows(h, v, dist))

        return batch_close_calls

    def _close_call_from_rows(self, h: Dict[str, Any], v: Dict[str, Any], distance: float) -> Dict[str, Any]:
        time_diff_ms = abs((v["timestamp"] - h["timestamp"]).total_seconds() * 1000)

        if distance < 1.0:
            severity = "HIGH"
        elif distance < 1.5:
            severity = "MEDIUM"
        else:
            severity = "LOW"

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
            "time_difference_ms": round(time_diff_ms, 1),
            "severity": severity,
        }

    def _aggregate_results(self, close_calls: List[Dict[str, Any]], results: Dict[str, Any]) -> None:
        by_vehicle_class: Dict[Any, int] = {}
        by_severity = {"HIGH": 0, "MEDIUM": 0, "LOW": 0}

        for cc in close_calls:
            vc = cc["vehicle_class"]
            by_vehicle_class[vc] = by_vehicle_class.get(vc, 0) + 1
            by_severity[cc["severity"]] += 1

        results["by_vehicle_class"] = by_vehicle_class
        results["by_severity"] = by_severity

        if close_calls:
            time_series: Dict[str, int] = {}
            for cc in close_calls:
                # minute resolution: 'YYYY-MM-DDTHH:MM'
                key = cc["timestamp"][:16]
                time_series[key] = time_series.get(key, 0) + 1
            results["time_series"] = [{"time": t, "count": c} for t, c in sorted(time_series.items())]

    def _get_human_qs(self):
        filters = Q(object_class=Detection.ObjectClass.HUMAN)
        if self.from_time:
            filters &= Q(timestamp__gte=self.from_time)
        if self.to_time:
            filters &= Q(timestamp__lte=self.to_time)
        if self.zone:
            filters &= Q(zone=self.zone)
        return Detection.objects.filter(filters)

    def _get_vehicle_rows_in_range(self, start_time: timezone.datetime, end_time: timezone.datetime) -> List[Dict[str, Any]]:
        filters = Q(object_class__in=self.VEHICLE_CLASSES)
        filters &= Q(timestamp__range=(start_time, end_time))
        if self.vehicle_class:
            filters &= Q(object_class=self.vehicle_class)
        if self.zone:
            filters &= Q(zone=self.zone)

        qs = Detection.objects.filter(filters).order_by("timestamp")
        return list(qs.values(*self.VEHICLE_FIELDS))


# ------- Safety Event KPI Service (overspeed, vest) ------- #
class SafetyEventKPIService:
    """
    Service to compute overspeed and vest violation KPIs.
    Kept readable while avoiding unnecessary ORM overhead.
    """

    OVERSPEED_MONITORED_CLASSES = [
        Detection.ObjectClass.VEHICLE,
        Detection.ObjectClass.PALLET_TRUCK,
        Detection.ObjectClass.AGV,
    ]

    @staticmethod
    def _safe_iso(dt: Optional[timezone.datetime]):
        if dt is None:
            return None
        if isinstance(dt, str):
            return dt
        if hasattr(dt, "isoformat"):
            return dt.isoformat()
        return str(dt)

    @staticmethod
    def compute_overspeed_events(
        speed_threshold: float = 1.5,
        from_time: Optional[timezone.datetime] = None,
        to_time: Optional[timezone.datetime] = None,
        zone: Optional[str] = None,
        object_class: Optional[str] = None,
        use_derived_speed: bool = False,
        include_humans: bool = False,
    ) -> Dict[str, Any]:
        filters = Q(speed__gt=speed_threshold)

        if object_class:
            filters &= Q(object_class=object_class)
        elif not include_humans:
            filters &= Q(object_class__in=SafetyEventKPIService.OVERSPEED_MONITORED_CLASSES)

        if from_time:
            if isinstance(from_time, str):
                from_time = parse_datetime(from_time)
            filters &= Q(timestamp__gte=from_time)
        if to_time:
            if isinstance(to_time, str):
                to_time = parse_datetime(to_time)
            filters &= Q(timestamp__lte=to_time)
        if zone:
            filters &= Q(zone=zone)

        qs = Detection.objects.filter(filters)

        total = qs.count()
        by_object_class = list(qs.values("object_class").annotate(count=Count("id")))

        return {
            "total_count": total,
            "speed_threshold": speed_threshold,
            "by_object_class": by_object_class,
            "statistics": {
                "detections_processed": total,
                "parameters_used": {
                    "speed_threshold": speed_threshold,
                    "use_derived_speed": use_derived_speed,
                    "from_time": SafetyEventKPIService._safe_iso(from_time),
                    "to_time": SafetyEventKPIService._safe_iso(to_time),
                    "zone": zone,
                    "object_class": object_class,
                    "include_humans": include_humans,
                    "monitored_classes": SafetyEventKPIService.OVERSPEED_MONITORED_CLASSES if not include_humans else "all",
                },
            },
        }

    @staticmethod
    def compute_vest_violations(
        from_time: Optional[timezone.datetime] = None,
        to_time: Optional[timezone.datetime] = None,
        zone: Optional[str] = None,
    ) -> Dict[str, Any]:
        filters = Q(object_class=Detection.ObjectClass.HUMAN) & Q(vest=False)

        if from_time:
            if isinstance(from_time, str):
                from_time = parse_datetime(from_time)
            filters &= Q(timestamp__gte=from_time)
        if to_time:
            if isinstance(to_time, str):
                to_time = parse_datetime(to_time)
            filters &= Q(timestamp__lte=to_time)
        if zone:
            filters &= Q(zone=zone)

        qs = Detection.objects.filter(filters)
        total = qs.count()
        by_zone = list(qs.values("zone").annotate(count=Count("id")))

        return {
            "total_count": total,
            "by_zone": by_zone,
            "statistics": {
                "detections_processed": total,
                "parameters_used": {
                    "from_time": SafetyEventKPIService._safe_iso(from_time),
                    "to_time": SafetyEventKPIService._safe_iso(to_time),
                    "zone": zone,
                },
            },
        }

    @staticmethod
    def compute_all_safety_kpis(
        from_time: Optional[timezone.datetime] = None,
        to_time: Optional[timezone.datetime] = None,
        zone: Optional[str] = None,
        close_call_params: Optional[Dict[str, Any]] = None,
        overspeed_params: Optional[Dict[str, Any]] = None,
    ) -> Dict[str, Any]:
        close_call_params = close_call_params or {}
        overspeed_params = overspeed_params or {}

        if from_time and isinstance(from_time, str):
            from_time = parse_datetime(from_time)
        if to_time and isinstance(to_time, str):
            to_time = parse_datetime(to_time)

        close_call_params.setdefault("distance_threshold", 2.0)
        close_call_params.setdefault("time_window_ms", 250)
        overspeed_params.setdefault("include_humans", False)

        close_calls = CloseCallKPI(from_time=from_time, to_time=to_time, zone=zone, **close_call_params).compute_close_calls()

        # pass overspeed params except 'zone' because we include zone separately
        overspeed_events = SafetyEventKPIService.compute_overspeed_events(from_time=from_time, to_time=to_time, zone=zone, **{k: v for k, v in overspeed_params.items() if k != "zone"})

        vest_violations = SafetyEventKPIService.compute_vest_violations(from_time=from_time, to_time=to_time, zone=zone)

        return {
            "close_calls": close_calls,
            "overspeed_events": overspeed_events,
            "vest_violations": vest_violations,
            "metadata": {
                "computed_at": timezone.now().isoformat(),
                "time_range": {
                    "from": SafetyEventKPIService._safe_iso(from_time),
                    "to": SafetyEventKPIService._safe_iso(to_time),
                },
                "zone": zone,
            },
        }
