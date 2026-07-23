from typing import Optional

from sqlmodel import Field, SQLModel

STATUS_OPTIONS = [
    "Planning",
    "Primary fermentation",
    "Secondary fermentation",
    "Stabilizing",
    "Backsweetened",
    "Conditioning",
    "Bottled",
    "Completed",
    "Discarded",
]

BREW_TYPES = ["Mead", "Beer", "Cider", "Wine", "Kombucha", "Other"]

INGREDIENT_CATEGORIES = [
    "Fermentable",
    "Yeast",
    "Nutrient",
    "Fruit",
    "Spice",
    "Additive",
    "Other",
]

INGREDIENT_STAGES = ["Primary", "Secondary", "Bottling"]

NUTRIENT_TYPES = ["Go-Ferm", "Fermaid-O", "Fermaid-K", "DAP", "Other"]


class Brew(SQLModel, table=True):
    __tablename__ = "brews"

    id: Optional[int] = Field(default=None, primary_key=True)
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
    calculated_abv: Optional[float] = None
    yeast: Optional[str] = None
    temperature: Optional[float] = None
    temperature_unit: Optional[str] = "°F"
    vessel: Optional[str] = None
    tasting_notes: Optional[str] = None
    process_notes: Optional[str] = None
    recipe_id: Optional[int] = Field(default=None, foreign_key="recipes.id")
    created_at: str
    updated_at: str


class Ingredient(SQLModel, table=True):
    __tablename__ = "ingredients"

    id: Optional[int] = Field(default=None, primary_key=True)
    brew_id: int = Field(foreign_key="brews.id")
    ingredient_name: str
    amount: Optional[float] = None
    unit: Optional[str] = None
    category: Optional[str] = None
    stage: Optional[str] = None
    addition_date: Optional[str] = None
    unit_cost: Optional[float] = None
    total_cost: Optional[float] = None
    notes: Optional[str] = None


class GravityReading(SQLModel, table=True):
    __tablename__ = "gravity_readings"

    id: Optional[int] = Field(default=None, primary_key=True)
    brew_id: int = Field(foreign_key="brews.id")
    reading_date: str
    specific_gravity: float
    temperature: Optional[float] = None
    temperature_unit: Optional[str] = "°F"
    notes: Optional[str] = None


class NutrientAddition(SQLModel, table=True):
    __tablename__ = "nutrient_additions"

    id: Optional[int] = Field(default=None, primary_key=True)
    brew_id: int = Field(foreign_key="brews.id")
    day_offset: int
    nutrient_type: str
    amount: Optional[float] = None
    unit: Optional[str] = None
    completed: bool = False
    completed_date: Optional[str] = None
    notes: Optional[str] = None


class IngredientPrice(SQLModel, table=True):
    __tablename__ = "ingredient_prices"

    id: Optional[int] = Field(default=None, primary_key=True)
    ingredient_name: str = Field(index=True)
    unit: str
    unit_cost: float
    updated_at: str


class Recipe(SQLModel, table=True):
    __tablename__ = "recipes"

    id: Optional[int] = Field(default=None, primary_key=True)
    name: str
    brew_type: str
    style: Optional[str] = None
    batch_size: Optional[float] = None
    batch_size_unit: Optional[str] = "gal"
    yeast: Optional[str] = None
    vessel: Optional[str] = None
    temperature: Optional[float] = None
    temperature_unit: Optional[str] = "°F"
    target_abv: Optional[float] = None
    process_notes: Optional[str] = None
    created_at: str
    updated_at: str


class RecipeIngredient(SQLModel, table=True):
    __tablename__ = "recipe_ingredients"

    id: Optional[int] = Field(default=None, primary_key=True)
    recipe_id: int = Field(foreign_key="recipes.id")
    ingredient_name: str
    amount: Optional[float] = None
    unit: Optional[str] = None
    category: Optional[str] = None
    stage: Optional[str] = None
    notes: Optional[str] = None


class RecipeNutrientAddition(SQLModel, table=True):
    __tablename__ = "recipe_nutrient_additions"

    id: Optional[int] = Field(default=None, primary_key=True)
    recipe_id: int = Field(foreign_key="recipes.id")
    day_offset: int
    nutrient_type: str
    amount: Optional[float] = None
    unit: Optional[str] = None
    notes: Optional[str] = None
