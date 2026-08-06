from typing import Optional

from sqlmodel import SQLModel


class BrewCreate(SQLModel):
    name: str
    brew_type: str
    style: Optional[str] = None
    batch_size: Optional[float] = None
    batch_size_unit: Optional[str] = "gal"
    start_date: str
    status: str
    original_gravity: Optional[float] = None
    target_abv: Optional[float] = None
    yeast: Optional[str] = None
    temperature: Optional[float] = None
    temperature_unit: Optional[str] = "°F"
    vessel: Optional[str] = None
    process_notes: Optional[str] = None


class BrewUpdate(SQLModel):
    name: str
    brew_type: str
    style: Optional[str] = None
    batch_size: Optional[float] = None
    batch_size_unit: Optional[str] = "gal"
    start_date: str
    rack_date: Optional[str] = None
    bottle_date: Optional[str] = None
    expected_ready_date: Optional[str] = None
    status: str
    original_gravity: Optional[float] = None
    final_gravity: Optional[float] = None
    target_abv: Optional[float] = None
    yeast: Optional[str] = None
    temperature: Optional[float] = None
    temperature_unit: Optional[str] = "°F"
    vessel: Optional[str] = None
    tasting_notes: Optional[str] = None
    process_notes: Optional[str] = None


class IngredientCreate(SQLModel):
    ingredient_name: str
    amount: Optional[float] = None
    unit: Optional[str] = None
    category: Optional[str] = None
    stage: Optional[str] = None
    addition_date: Optional[str] = None
    unit_cost: Optional[float] = None
    notes: Optional[str] = None


class IngredientUpdate(SQLModel):
    ingredient_name: str
    amount: Optional[float] = None
    unit: Optional[str] = None
    category: Optional[str] = None
    stage: Optional[str] = None
    addition_date: Optional[str] = None
    unit_cost: Optional[float] = None
    notes: Optional[str] = None


class GravityReadingCreate(SQLModel):
    reading_date: str
    specific_gravity: float
    temperature: Optional[float] = None
    temperature_unit: Optional[str] = "°F"
    notes: Optional[str] = None


class NutrientAdditionCreate(SQLModel):
    day_offset: int
    nutrient_type: str
    amount: Optional[float] = None
    unit: Optional[str] = None
    notes: Optional[str] = None


class NutrientAdditionUpdate(SQLModel):
    completed: bool
    completed_date: Optional[str] = None


class IngredientPriceUpsert(SQLModel):
    ingredient_name: str
    unit: str
    unit_cost: float


class SaveAsRecipeInput(SQLModel):
    name: str


class CreateBrewFromRecipeInput(SQLModel):
    start_date: str
