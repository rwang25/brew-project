from datetime import date, timedelta

from fastapi import APIRouter, Depends
from sqlmodel import Session, select

from ..database import get_session
from ..models import Brew, NutrientAddition

router = APIRouter(prefix="/api", tags=["reminders"])

INACTIVE_STATUSES = {"Completed", "Discarded"}

NUTRIENT_DUE_SOON_DAYS = 3
READY_DUE_SOON_DAYS = 7


def parse_date(value: str) -> date:
    return date.fromisoformat(value[:10])


@router.get("/reminders")
def get_reminders(session: Session = Depends(get_session)) -> dict:
    today = date.today()

    nutrient_reminders = []
    query = (
        select(NutrientAddition, Brew)
        .join(Brew, NutrientAddition.brew_id == Brew.id)
        .where(NutrientAddition.completed == False)  # noqa: E712
        .where(Brew.status.not_in(INACTIVE_STATUSES))
    )
    for addition, brew in session.exec(query):
        scheduled = parse_date(brew.start_date) + timedelta(days=addition.day_offset)
        days_until = (scheduled - today).days
        if days_until <= NUTRIENT_DUE_SOON_DAYS:
            nutrient_reminders.append(
                {
                    "brew_id": brew.id,
                    "brew_name": brew.name,
                    "nutrient_type": addition.nutrient_type,
                    "scheduled_date": scheduled.isoformat(),
                    "status": "overdue" if days_until < 0 else "due_soon",
                }
            )

    ready_reminders = []
    query = select(Brew).where(Brew.status.not_in(INACTIVE_STATUSES | {"Bottled"}))
    for brew in session.exec(query):
        if not brew.expected_ready_date:
            continue
        ready = parse_date(brew.expected_ready_date)
        days_until = (ready - today).days
        if days_until <= READY_DUE_SOON_DAYS:
            ready_reminders.append(
                {
                    "brew_id": brew.id,
                    "brew_name": brew.name,
                    "expected_ready_date": ready.isoformat(),
                    "status": "overdue" if days_until < 0 else "due_soon",
                }
            )

    nutrient_reminders.sort(key=lambda r: r["scheduled_date"])
    ready_reminders.sort(key=lambda r: r["expected_ready_date"])

    return {"nutrient_reminders": nutrient_reminders, "ready_reminders": ready_reminders}
