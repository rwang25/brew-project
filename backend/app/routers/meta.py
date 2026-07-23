from fastapi import APIRouter

from ..models import (
    BREW_TYPES,
    INGREDIENT_CATEGORIES,
    INGREDIENT_STAGES,
    NUTRIENT_TYPES,
    STATUS_OPTIONS,
)

router = APIRouter(prefix="/api/meta", tags=["meta"])


@router.get("")
def get_meta() -> dict:
    return {
        "brew_types": BREW_TYPES,
        "status_options": STATUS_OPTIONS,
        "ingredient_categories": INGREDIENT_CATEGORIES,
        "ingredient_stages": INGREDIENT_STAGES,
        "nutrient_types": NUTRIENT_TYPES,
        "batch_size_units": ["gal", "L", "qt", "mL"],
        "temperature_units": ["°F", "°C"],
    }
