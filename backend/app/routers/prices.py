from typing import List

from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session, func, select

from ..database import get_session
from ..models import IngredientPrice
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
    query = select(IngredientPrice).where(
        func.lower(IngredientPrice.ingredient_name) == payload.ingredient_name.lower(),
        func.lower(IngredientPrice.unit) == payload.unit.lower(),
    )
    existing = session.exec(query).first()
    if existing:
        existing.unit_cost = payload.unit_cost
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
