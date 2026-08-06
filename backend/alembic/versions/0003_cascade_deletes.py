"""add ON DELETE CASCADE to nutrient_additions/recipe_ingredients/recipe_nutrient_additions

SQLite doesn't support ALTER TABLE ... DROP/ADD CONSTRAINT, and the existing
foreign keys here were created unnamed, so batch_alter_table's drop_constraint
(which needs a name) isn't reliable. Recreate each table from scratch instead:
rename old -> create new with the CASCADE FK -> copy rows -> drop old.

Revision ID: 0003_cascade_deletes
Revises: 0002_brew_recipe_id
Create Date: 2026-08-01

"""
from typing import Sequence, Union

import sqlalchemy as sa

from alembic import op

revision: str = "0003_cascade_deletes"
down_revision: Union[str, Sequence[str], None] = "0002_brew_recipe_id"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.rename_table("nutrient_additions", "nutrient_additions_old")
    op.create_table(
        "nutrient_additions",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column(
            "brew_id", sa.Integer(), sa.ForeignKey("brews.id", ondelete="CASCADE"), nullable=False
        ),
        sa.Column("day_offset", sa.Integer(), nullable=False),
        sa.Column("nutrient_type", sa.String(), nullable=False),
        sa.Column("amount", sa.Float(), nullable=True),
        sa.Column("unit", sa.String(), nullable=True),
        sa.Column("completed", sa.Boolean(), nullable=False, server_default=sa.false()),
        sa.Column("completed_date", sa.String(), nullable=True),
        sa.Column("notes", sa.String(), nullable=True),
    )
    op.execute("INSERT INTO nutrient_additions SELECT * FROM nutrient_additions_old")
    op.drop_table("nutrient_additions_old")

    op.rename_table("recipe_ingredients", "recipe_ingredients_old")
    op.create_table(
        "recipe_ingredients",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column(
            "recipe_id",
            sa.Integer(),
            sa.ForeignKey("recipes.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column("ingredient_name", sa.String(), nullable=False),
        sa.Column("amount", sa.Float(), nullable=True),
        sa.Column("unit", sa.String(), nullable=True),
        sa.Column("category", sa.String(), nullable=True),
        sa.Column("stage", sa.String(), nullable=True),
        sa.Column("notes", sa.String(), nullable=True),
    )
    op.execute("INSERT INTO recipe_ingredients SELECT * FROM recipe_ingredients_old")
    op.drop_table("recipe_ingredients_old")

    op.rename_table("recipe_nutrient_additions", "recipe_nutrient_additions_old")
    op.create_table(
        "recipe_nutrient_additions",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column(
            "recipe_id",
            sa.Integer(),
            sa.ForeignKey("recipes.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column("day_offset", sa.Integer(), nullable=False),
        sa.Column("nutrient_type", sa.String(), nullable=False),
        sa.Column("amount", sa.Float(), nullable=True),
        sa.Column("unit", sa.String(), nullable=True),
        sa.Column("notes", sa.String(), nullable=True),
    )
    op.execute(
        "INSERT INTO recipe_nutrient_additions SELECT * FROM recipe_nutrient_additions_old"
    )
    op.drop_table("recipe_nutrient_additions_old")


def downgrade() -> None:
    op.rename_table("recipe_nutrient_additions", "recipe_nutrient_additions_old")
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
    op.execute(
        "INSERT INTO recipe_nutrient_additions SELECT * FROM recipe_nutrient_additions_old"
    )
    op.drop_table("recipe_nutrient_additions_old")

    op.rename_table("recipe_ingredients", "recipe_ingredients_old")
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
    op.execute("INSERT INTO recipe_ingredients SELECT * FROM recipe_ingredients_old")
    op.drop_table("recipe_ingredients_old")

    op.rename_table("nutrient_additions", "nutrient_additions_old")
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
    op.execute("INSERT INTO nutrient_additions SELECT * FROM nutrient_additions_old")
    op.drop_table("nutrient_additions_old")
