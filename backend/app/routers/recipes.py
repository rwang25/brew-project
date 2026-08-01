from typing import List

from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session, select

from ..database import get_session
from ..models import (
    Brew,
    Ingredient,
    IngredientPrice,
    NutrientAddition,
    Recipe,
    RecipeIngredient,
    RecipeNutrientAddition,
)
from ..schemas import CreateBrewFromRecipeInput, SaveAsRecipeInput
from ..utils import now_iso

router = APIRouter(prefix="/api", tags=["recipes"])


def get_recipe_or_404(recipe_id: int, session: Session) -> Recipe:
    recipe = session.get(Recipe, recipe_id)
    if recipe is None:
        raise HTTPException(status_code=404, detail="Recipe not found")
    return recipe


def price_lookup(session: Session) -> dict:
    prices = session.exec(select(IngredientPrice))
    return {(p.ingredient_name.lower(), p.unit.lower()): p.unit_cost for p in prices}


def estimate_ingredient_cost(ingredient: RecipeIngredient, prices: dict) -> float | None:
    if ingredient.amount is None or not ingredient.unit:
        return None
    unit_cost = prices.get((ingredient.ingredient_name.lower(), ingredient.unit.lower()))
    if unit_cost is None:
        return None
    return ingredient.amount * unit_cost


@router.get("/recipes", response_model=None)
def list_recipes(session: Session = Depends(get_session)) -> List[dict]:
    recipes = list(session.exec(select(Recipe).order_by(Recipe.name)))
    prices = price_lookup(session)

    all_ingredients = list(session.exec(select(RecipeIngredient)))
    cost_by_recipe: dict[int, float] = {}
    for ing in all_ingredients:
        cost = estimate_ingredient_cost(ing, prices)
        if cost is not None:
            cost_by_recipe[ing.recipe_id] = cost_by_recipe.get(ing.recipe_id, 0) + cost

    return [
        {**recipe.model_dump(), "estimated_cost": cost_by_recipe.get(recipe.id)}
        for recipe in recipes
    ]


@router.get("/recipes/{recipe_id}", response_model=Recipe)
def get_recipe(recipe_id: int, session: Session = Depends(get_session)) -> Recipe:
    return get_recipe_or_404(recipe_id, session)


@router.get("/recipes/{recipe_id}/ingredients", response_model=List[RecipeIngredient])
def list_recipe_ingredients(
    recipe_id: int, session: Session = Depends(get_session)
) -> List[RecipeIngredient]:
    get_recipe_or_404(recipe_id, session)
    query = select(RecipeIngredient).where(RecipeIngredient.recipe_id == recipe_id)
    return list(session.exec(query))


@router.get("/recipes/{recipe_id}/nutrient-schedule", response_model=List[RecipeNutrientAddition])
def list_recipe_nutrient_schedule(
    recipe_id: int, session: Session = Depends(get_session)
) -> List[RecipeNutrientAddition]:
    get_recipe_or_404(recipe_id, session)
    query = (
        select(RecipeNutrientAddition)
        .where(RecipeNutrientAddition.recipe_id == recipe_id)
        .order_by(RecipeNutrientAddition.day_offset)
    )
    return list(session.exec(query))


@router.delete("/recipes/{recipe_id}", status_code=204)
def delete_recipe(recipe_id: int, session: Session = Depends(get_session)) -> None:
    recipe = get_recipe_or_404(recipe_id, session)

    for ingredient in session.exec(
        select(RecipeIngredient).where(RecipeIngredient.recipe_id == recipe_id)
    ):
        session.delete(ingredient)
    for nutrient in session.exec(
        select(RecipeNutrientAddition).where(RecipeNutrientAddition.recipe_id == recipe_id)
    ):
        session.delete(nutrient)

    session.delete(recipe)
    session.commit()


@router.post("/brews/{brew_id}/save-as-recipe", response_model=Recipe, status_code=201)
def save_as_recipe(
    brew_id: int, payload: SaveAsRecipeInput, session: Session = Depends(get_session)
) -> Recipe:
    brew = session.get(Brew, brew_id)
    if brew is None:
        raise HTTPException(status_code=404, detail="Brew not found")

    timestamp = now_iso()
    recipe = Recipe(
        name=payload.name,
        brew_type=brew.brew_type,
        style=brew.style,
        batch_size=brew.batch_size,
        batch_size_unit=brew.batch_size_unit,
        yeast=brew.yeast,
        vessel=brew.vessel,
        temperature=brew.temperature,
        temperature_unit=brew.temperature_unit,
        target_abv=brew.target_abv,
        process_notes=brew.process_notes,
        created_at=timestamp,
        updated_at=timestamp,
    )
    session.add(recipe)
    session.commit()
    session.refresh(recipe)

    ingredients = session.exec(select(Ingredient).where(Ingredient.brew_id == brew_id))
    for ing in ingredients:
        session.add(
            RecipeIngredient(
                recipe_id=recipe.id,
                ingredient_name=ing.ingredient_name,
                amount=ing.amount,
                unit=ing.unit,
                category=ing.category,
                stage=ing.stage,
                notes=ing.notes,
            )
        )

    nutrients = session.exec(
        select(NutrientAddition).where(NutrientAddition.brew_id == brew_id)
    )
    for n in nutrients:
        session.add(
            RecipeNutrientAddition(
                recipe_id=recipe.id,
                day_offset=n.day_offset,
                nutrient_type=n.nutrient_type,
                amount=n.amount,
                unit=n.unit,
                notes=n.notes,
            )
        )

    session.commit()
    session.refresh(recipe)
    return recipe


@router.post("/recipes/{recipe_id}/create-brew", response_model=Brew, status_code=201)
def create_brew_from_recipe(
    recipe_id: int, payload: CreateBrewFromRecipeInput, session: Session = Depends(get_session)
) -> Brew:
    recipe = get_recipe_or_404(recipe_id, session)

    timestamp = now_iso()
    brew = Brew(
        name=recipe.name,
        brew_type=recipe.brew_type,
        style=recipe.style,
        batch_size=recipe.batch_size,
        batch_size_unit=recipe.batch_size_unit,
        start_date=payload.start_date,
        status="Planning",
        target_abv=recipe.target_abv,
        yeast=recipe.yeast,
        temperature=recipe.temperature,
        temperature_unit=recipe.temperature_unit,
        vessel=recipe.vessel,
        process_notes=recipe.process_notes,
        recipe_id=recipe.id,
        created_at=timestamp,
        updated_at=timestamp,
    )
    session.add(brew)
    session.commit()
    session.refresh(brew)

    recipe_ingredients = session.exec(
        select(RecipeIngredient).where(RecipeIngredient.recipe_id == recipe_id)
    )
    for ri in recipe_ingredients:
        session.add(
            Ingredient(
                brew_id=brew.id,
                ingredient_name=ri.ingredient_name,
                amount=ri.amount,
                unit=ri.unit,
                category=ri.category,
                stage=ri.stage,
                notes=ri.notes,
            )
        )

    recipe_nutrients = session.exec(
        select(RecipeNutrientAddition).where(RecipeNutrientAddition.recipe_id == recipe_id)
    )
    for rn in recipe_nutrients:
        session.add(
            NutrientAddition(
                brew_id=brew.id,
                day_offset=rn.day_offset,
                nutrient_type=rn.nutrient_type,
                amount=rn.amount,
                unit=rn.unit,
            )
        )

    session.commit()
    session.refresh(brew)
    return brew
