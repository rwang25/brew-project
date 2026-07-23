"""add mead features: nutrient schedule, staging, recipes, cost tracking

Revision ID: 0001_mead_features
Revises:
Create Date: 2026-07-19

"""
from typing import Sequence, Union

import sqlalchemy as sa

from alembic import op

revision: str = "0001_mead_features"
down_revision: Union[str, Sequence[str], None] = "0000_initial"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column("brews", sa.Column("cloned_from_id", sa.Integer(), nullable=True))

    op.add_column("ingredients", sa.Column("stage", sa.String(), nullable=True))
    op.add_column("ingredients", sa.Column("addition_date", sa.String(), nullable=True))
    op.add_column("ingredients", sa.Column("unit_cost", sa.Float(), nullable=True))
    op.add_column("ingredients", sa.Column("total_cost", sa.Float(), nullable=True))

    op.create_table(
        "nutrient_additions",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("brew_id", sa.Integer(), sa.ForeignKey("brews.id"), nullable=False),
        sa.Column("day_offset", sa.Integer(), nullable=False),
        sa.Column("nutrient_type", sa.String(), nullable=False),
        sa.Column("amount", sa.Float(), nullable=True),
        sa.Column("unit", sa.String(), nullable=True),
        sa.Column("completed", sa.Boolean(), nullable=False, server_default=sa.false()),
        sa.Column("completed_date", sa.String(), nullable=True),
        sa.Column("notes", sa.String(), nullable=True),
    )

    op.create_table(
        "ingredient_prices",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("ingredient_name", sa.String(), nullable=False),
        sa.Column("unit", sa.String(), nullable=False),
        sa.Column("unit_cost", sa.Float(), nullable=False),
        sa.Column("updated_at", sa.String(), nullable=False),
    )
    op.create_index(
        "ix_ingredient_prices_ingredient_name",
        "ingredient_prices",
        ["ingredient_name"],
    )

    op.create_table(
        "recipes",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("name", sa.String(), nullable=False),
        sa.Column("brew_type", sa.String(), nullable=False),
        sa.Column("style", sa.String(), nullable=True),
        sa.Column("batch_size", sa.Float(), nullable=True),
        sa.Column("batch_size_unit", sa.String(), nullable=True, server_default="gal"),
        sa.Column("yeast", sa.String(), nullable=True),
        sa.Column("vessel", sa.String(), nullable=True),
        sa.Column("temperature", sa.Float(), nullable=True),
        sa.Column("temperature_unit", sa.String(), nullable=True, server_default="°F"),
        sa.Column("target_abv", sa.Float(), nullable=True),
        sa.Column("process_notes", sa.String(), nullable=True),
        sa.Column("created_at", sa.String(), nullable=False),
        sa.Column("updated_at", sa.String(), nullable=False),
    )

    op.create_table(
        "recipe_ingredients",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("recipe_id", sa.Integer(), sa.ForeignKey("recipes.id"), nullable=False),
        sa.Column("ingredient_name", sa.String(), nullable=False),
        sa.Column("amount", sa.Float(), nullable=True),
        sa.Column("unit", sa.String(), nullable=True),
        sa.Column("category", sa.String(), nullable=True),
        sa.Column("stage", sa.String(), nullable=True),
        sa.Column("notes", sa.String(), nullable=True),
    )

    op.create_table(
        "recipe_nutrient_additions",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("recipe_id", sa.Integer(), sa.ForeignKey("recipes.id"), nullable=False),
        sa.Column("day_offset", sa.Integer(), nullable=False),
        sa.Column("nutrient_type", sa.String(), nullable=False),
        sa.Column("amount", sa.Float(), nullable=True),
        sa.Column("unit", sa.String(), nullable=True),
        sa.Column("notes", sa.String(), nullable=True),
    )


def downgrade() -> None:
    op.drop_table("recipe_nutrient_additions")
    op.drop_table("recipe_ingredients")
    op.drop_table("recipes")
    op.drop_index("ix_ingredient_prices_ingredient_name", table_name="ingredient_prices")
    op.drop_table("ingredient_prices")
    op.drop_table("nutrient_additions")

    with op.batch_alter_table("ingredients") as batch_op:
        batch_op.drop_column("total_cost")
        batch_op.drop_column("unit_cost")
        batch_op.drop_column("addition_date")
        batch_op.drop_column("stage")

    with op.batch_alter_table("brews") as batch_op:
        batch_op.drop_column("cloned_from_id")
