from typing import List

from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session, select

from ..database import get_session
from ..models import Brew, NutrientAddition
from ..schemas import NutrientAdditionCreate, NutrientAdditionUpdate

router = APIRouter(prefix="/api", tags=["nutrients"])

# Standard staggered-nutrient protocol (TOSNA-style): Go-Ferm at pitch,
# then Fermaid-O at 24/72/120 hours, tapering off before the 1/3 sugar break.
TOSNA_TEMPLATE = [
    {"day_offset": 0, "nutrient_type": "Go-Ferm", "amount": None, "unit": "g"},
    {"day_offset": 1, "nutrient_type": "Fermaid-O", "amount": None, "unit": "g"},
    {"day_offset": 3, "nutrient_type": "Fermaid-O", "amount": None, "unit": "g"},
    {"day_offset": 5, "nutrient_type": "Fermaid-O", "amount": None, "unit": "g"},
]


def get_brew_or_404(brew_id: int, session: Session) -> Brew:
    brew = session.get(Brew, brew_id)
    if brew is None:
        raise HTTPException(status_code=404, detail="Brew not found")
    return brew


@router.get("/brews/{brew_id}/nutrient-schedule", response_model=List[NutrientAddition])
def list_nutrient_schedule(
    brew_id: int, session: Session = Depends(get_session)
) -> List[NutrientAddition]:
    get_brew_or_404(brew_id, session)
    query = (
        select(NutrientAddition)
        .where(NutrientAddition.brew_id == brew_id)
        .order_by(NutrientAddition.day_offset, NutrientAddition.id)
    )
    return list(session.exec(query))


@router.post(
    "/brews/{brew_id}/nutrient-schedule", response_model=NutrientAddition, status_code=201
)
def add_nutrient_addition(
    brew_id: int, payload: NutrientAdditionCreate, session: Session = Depends(get_session)
) -> NutrientAddition:
    get_brew_or_404(brew_id, session)
    addition = NutrientAddition(brew_id=brew_id, **payload.model_dump())
    session.add(addition)
    session.commit()
    session.refresh(addition)
    return addition


@router.post(
    "/brews/{brew_id}/nutrient-schedule/generate-tosna",
    response_model=List[NutrientAddition],
    status_code=201,
)
def generate_tosna_schedule(
    brew_id: int, session: Session = Depends(get_session)
) -> List[NutrientAddition]:
    get_brew_or_404(brew_id, session)
    additions = [NutrientAddition(brew_id=brew_id, **entry) for entry in TOSNA_TEMPLATE]
    session.add_all(additions)
    session.commit()
    for addition in additions:
        session.refresh(addition)
    return additions


@router.patch("/nutrient-schedule/{addition_id}", response_model=NutrientAddition)
def update_nutrient_addition(
    addition_id: int, payload: NutrientAdditionUpdate, session: Session = Depends(get_session)
) -> NutrientAddition:
    addition = session.get(NutrientAddition, addition_id)
    if addition is None:
        raise HTTPException(status_code=404, detail="Nutrient addition not found")
    addition.completed = payload.completed
    addition.completed_date = payload.completed_date
    session.add(addition)
    session.commit()
    session.refresh(addition)
    return addition


@router.delete("/nutrient-schedule/{addition_id}", status_code=204)
def delete_nutrient_addition(addition_id: int, session: Session = Depends(get_session)) -> None:
    addition = session.get(NutrientAddition, addition_id)
    if addition is None:
        raise HTTPException(status_code=404, detail="Nutrient addition not found")
    session.delete(addition)
    session.commit()
