from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session, func, select

from ..database import get_session
from ..models import Brew, GravityReading, Ingredient, NutrientAddition
from ..schemas import (
    BrewCreate,
    BrewUpdate,
    GravityReadingCreate,
    IngredientCreate,
    IngredientUpdate,
)
from ..utils import calculate_abv, now_iso


def compute_total_cost(amount: Optional[float], unit_cost: Optional[float]) -> Optional[float]:
    if amount is None or unit_cost is None:
        return None
    return amount * unit_cost

router = APIRouter(prefix="/api", tags=["brews"])


def get_brew_or_404(brew_id: int, session: Session) -> Brew:
    brew = session.get(Brew, brew_id)
    if brew is None:
        raise HTTPException(status_code=404, detail="Brew not found")
    return brew


@router.get("/brews", response_model=None)
def list_brews(
    status: Optional[str] = None,
    session: Session = Depends(get_session),
) -> List[dict]:
    query = select(Brew)
    if status:
        query = query.where(Brew.status == status)
    query = query.order_by(Brew.start_date.desc(), Brew.id.desc())
    brews = list(session.exec(query))

    cost_rows = session.exec(
        select(Ingredient.brew_id, func.sum(Ingredient.total_cost)).group_by(
            Ingredient.brew_id
        )
    ).all()
    cost_by_brew = {brew_id: total for brew_id, total in cost_rows if total is not None}

    # The home-page shelf derives each batch's colour from its ingredients and
    # flags fermenting batches whose gravity hasn't been checked in a while.
    names_by_brew: dict[int, List[str]] = {}
    for brew_id, name in session.exec(
        select(Ingredient.brew_id, Ingredient.ingredient_name).order_by(Ingredient.id)
    ):
        names_by_brew.setdefault(brew_id, []).append(name)

    latest_reading_by_brew: dict[int, tuple[str, float]] = {}
    reading_count_by_brew: dict[int, int] = {}
    for brew_id, reading_date, gravity in session.exec(
        select(
            GravityReading.brew_id,
            GravityReading.reading_date,
            GravityReading.specific_gravity,
        ).order_by(GravityReading.reading_date, GravityReading.id)
    ):
        latest_reading_by_brew[brew_id] = (reading_date, gravity)
        reading_count_by_brew[brew_id] = reading_count_by_brew.get(brew_id, 0) + 1

    summaries = []
    for brew in brews:
        latest = latest_reading_by_brew.get(brew.id)
        summaries.append(
            {
                **brew.model_dump(),
                "total_ingredient_cost": cost_by_brew.get(brew.id),
                "ingredient_names": names_by_brew.get(brew.id, []),
                "last_reading_date": latest[0] if latest else None,
                "latest_gravity": latest[1] if latest else None,
                "reading_count": reading_count_by_brew.get(brew.id, 0),
            }
        )
    return summaries


@router.post("/brews", response_model=Brew, status_code=201)
def create_brew(payload: BrewCreate, session: Session = Depends(get_session)) -> Brew:
    timestamp = now_iso()
    brew = Brew(
        **payload.model_dump(),
        calculated_abv=None,
        created_at=timestamp,
        updated_at=timestamp,
    )
    session.add(brew)
    session.commit()
    session.refresh(brew)
    return brew


@router.get("/brews/{brew_id}", response_model=Brew)
def get_brew(brew_id: int, session: Session = Depends(get_session)) -> Brew:
    return get_brew_or_404(brew_id, session)


@router.put("/brews/{brew_id}", response_model=Brew)
def update_brew(
    brew_id: int, payload: BrewUpdate, session: Session = Depends(get_session)
) -> Brew:
    brew = get_brew_or_404(brew_id, session)
    for key, value in payload.model_dump().items():
        setattr(brew, key, value)
    brew.calculated_abv = calculate_abv(brew.original_gravity, brew.final_gravity)
    brew.updated_at = now_iso()
    session.add(brew)
    session.commit()
    session.refresh(brew)
    return brew


@router.delete("/brews/{brew_id}", status_code=204)
def delete_brew(brew_id: int, session: Session = Depends(get_session)) -> None:
    brew = get_brew_or_404(brew_id, session)
    # Ingredient/GravityReading cascade at the DB level; NutrientAddition doesn't yet.
    for addition in session.exec(
        select(NutrientAddition).where(NutrientAddition.brew_id == brew_id)
    ):
        session.delete(addition)
    session.delete(brew)
    session.commit()


@router.get("/brews/{brew_id}/ingredients", response_model=List[Ingredient])
def list_ingredients(brew_id: int, session: Session = Depends(get_session)) -> List[Ingredient]:
    get_brew_or_404(brew_id, session)
    query = select(Ingredient).where(Ingredient.brew_id == brew_id).order_by(Ingredient.id)
    return list(session.exec(query))


@router.post("/brews/{brew_id}/ingredients", response_model=Ingredient, status_code=201)
def add_ingredient(
    brew_id: int, payload: IngredientCreate, session: Session = Depends(get_session)
) -> Ingredient:
    get_brew_or_404(brew_id, session)
    total_cost = compute_total_cost(payload.amount, payload.unit_cost)
    ingredient = Ingredient(brew_id=brew_id, total_cost=total_cost, **payload.model_dump())
    session.add(ingredient)
    session.commit()
    session.refresh(ingredient)
    return ingredient


@router.put("/ingredients/{ingredient_id}", response_model=Ingredient)
def update_ingredient(
    ingredient_id: int, payload: IngredientUpdate, session: Session = Depends(get_session)
) -> Ingredient:
    ingredient = session.get(Ingredient, ingredient_id)
    if ingredient is None:
        raise HTTPException(status_code=404, detail="Ingredient not found")
    for key, value in payload.model_dump().items():
        setattr(ingredient, key, value)
    ingredient.total_cost = compute_total_cost(ingredient.amount, ingredient.unit_cost)
    session.add(ingredient)
    session.commit()
    session.refresh(ingredient)
    return ingredient


@router.delete("/ingredients/{ingredient_id}", status_code=204)
def delete_ingredient(ingredient_id: int, session: Session = Depends(get_session)) -> None:
    ingredient = session.get(Ingredient, ingredient_id)
    if ingredient is None:
        raise HTTPException(status_code=404, detail="Ingredient not found")
    session.delete(ingredient)
    session.commit()


@router.get("/brews/{brew_id}/gravity-readings", response_model=List[GravityReading])
def list_gravity_readings(
    brew_id: int, session: Session = Depends(get_session)
) -> List[GravityReading]:
    get_brew_or_404(brew_id, session)
    query = (
        select(GravityReading)
        .where(GravityReading.brew_id == brew_id)
        .order_by(GravityReading.reading_date, GravityReading.id)
    )
    return list(session.exec(query))


@router.post("/brews/{brew_id}/gravity-readings", response_model=GravityReading, status_code=201)
def add_gravity_reading(
    brew_id: int, payload: GravityReadingCreate, session: Session = Depends(get_session)
) -> GravityReading:
    brew = get_brew_or_404(brew_id, session)
    reading = GravityReading(brew_id=brew_id, **payload.model_dump())
    session.add(reading)
    session.commit()
    session.refresh(reading)

    latest_query = (
        select(GravityReading)
        .where(GravityReading.brew_id == brew_id)
        .order_by(GravityReading.reading_date.desc(), GravityReading.id.desc())
    )
    latest = session.exec(latest_query).first()
    if latest is not None:
        brew.final_gravity = latest.specific_gravity
        brew.calculated_abv = calculate_abv(brew.original_gravity, latest.specific_gravity)
        brew.updated_at = now_iso()
        session.add(brew)
        session.commit()

    return reading


@router.delete("/gravity-readings/{reading_id}", status_code=204)
def delete_gravity_reading(reading_id: int, session: Session = Depends(get_session)) -> None:
    reading = session.get(GravityReading, reading_id)
    if reading is None:
        raise HTTPException(status_code=404, detail="Gravity reading not found")
    session.delete(reading)
    session.commit()
