from datetime import datetime, timezone
from typing import Optional


def calculate_abv(original_gravity: Optional[float], final_gravity: Optional[float]) -> Optional[float]:
    if original_gravity is None or final_gravity is None:
        return None
    return max(0.0, (original_gravity - final_gravity) * 131.25)


def now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()
