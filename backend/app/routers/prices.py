from typing import List

from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session, func, select

from ..database import get_session
from ..models import Ingredient, IngredientPrice, RecipeIngredient
from ..schemas import IngredientPriceUpsert
from ..utils import now_iso

router = APIRouter(prefix="/api", tags=["prices"])


@router.get("/ingredient-prices", response_model=List[IngredientPrice])
def list_ingredient_prices(session: Session = Depends(get_session)) -> List[IngredientPrice]:
    query = select(IngredientPrice).order_by(func.lower(IngredientPrice.ingredient_name))
    return list(session.exec(query))


@router.post("/ingredient-prices", response_model=IngredientPrice, status_code=201)
def upsert_ingredient_price(
    payload: IngredientPriceUpsert, session: Session = Depends(get_session)
) -> IngredientPrice:
    # container/color are only touched when the caller sends them, so the
    # ingredient form's cost-only upserts don't wipe a pantry override.
    overrides = payload.model_dump(include={"container", "color"}, exclude_unset=True)

    query = select(IngredientPrice).where(
        func.lower(IngredientPrice.ingredient_name) == payload.ingredient_name.lower(),
        func.lower(IngredientPrice.unit) == payload.unit.lower(),
    )
    existing = session.exec(query).first()
    if existing:
        existing.unit_cost = payload.unit_cost
        for key, value in overrides.items():
            setattr(existing, key, value)
        existing.updated_at = now_iso()
        session.add(existing)
        session.commit()
        session.refresh(existing)
        return existing

    price = IngredientPrice(
        ingredient_name=payload.ingredient_name,
        unit=payload.unit,
        unit_cost=payload.unit_cost,
        updated_at=now_iso(),
        **overrides,
    )
    session.add(price)
    session.commit()
    session.refresh(price)
    return price


@router.delete("/ingredient-prices/{price_id}", status_code=204)
def delete_ingredient_price(price_id: int, session: Session = Depends(get_session)) -> None:
    price = session.get(IngredientPrice, price_id)
    if price is None:
        raise HTTPException(status_code=404, detail="Price not found")
    session.delete(price)
    session.commit()


@router.get("/ingredient-usage", response_model=None)
def ingredient_usage(session: Session = Depends(get_session)) -> List[dict]:
    """Per ingredient name (case-insensitive): how many batches and recipes use
    it and how much has been spent on it across batches."""
    usage: dict[str, dict] = {}

    def entry(name: str) -> dict:
        key = name.lower()
        if key not in usage:
            usage[key] = {
                "ingredient_name": name,
                "batch_count": 0,
                "recipe_count": 0,
                "total_cost": None,
            }
        return usage[key]

    batch_rows = session.exec(
        select(
            Ingredient.ingredient_name,
            func.count(func.distinct(Ingredient.brew_id)),
            func.sum(Ingredient.total_cost),
        ).group_by(func.lower(Ingredient.ingredient_name))
    )
    for name, batch_count, total_cost in batch_rows:
        row = entry(name)
        row["batch_count"] = batch_count
        row["total_cost"] = total_cost

    recipe_rows = session.exec(
        select(
            RecipeIngredient.ingredient_name,
            func.count(func.distinct(RecipeIngredient.recipe_id)),
        ).group_by(func.lower(RecipeIngredient.ingredient_name))
    )
    for name, recipe_count in recipe_rows:
        entry(name)["recipe_count"] = recipe_count

    return list(usage.values())
