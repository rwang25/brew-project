"""initial schema: brews, ingredients, gravity_readings

Revision ID: 0000_initial
Revises:
Create Date: 2026-07-19

"""
from typing import Sequence, Union

import sqlalchemy as sa

from alembic import op

revision: str = "0000_initial"
down_revision: Union[str, Sequence[str], None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "brews",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("name", sa.String(), nullable=False),
        sa.Column("brew_type", sa.String(), nullable=False),
        sa.Column("style", sa.String(), nullable=True),
        sa.Column("batch_size", sa.Float(), nullable=True),
        sa.Column("batch_size_unit", sa.String(), nullable=True, server_default="gal"),
        sa.Column("start_date", sa.String(), nullable=False),
        sa.Column("rack_date", sa.String(), nullable=True),
        sa.Column("bottle_date", sa.String(), nullable=True),
        sa.Column("expected_ready_date", sa.String(), nullable=True),
        sa.Column("status", sa.String(), nullable=False),
        sa.Column("original_gravity", sa.Float(), nullable=True),
        sa.Column("final_gravity", sa.Float(), nullable=True),
        sa.Column("target_abv", sa.Float(), nullable=True),
        sa.Column("calculated_abv", sa.Float(), nullable=True),
        sa.Column("yeast", sa.String(), nullable=True),
        sa.Column("temperature", sa.Float(), nullable=True),
        sa.Column("temperature_unit", sa.String(), nullable=True, server_default="°F"),
        sa.Column("vessel", sa.String(), nullable=True),
        sa.Column("tasting_notes", sa.String(), nullable=True),
        sa.Column("process_notes", sa.String(), nullable=True),
        sa.Column("created_at", sa.String(), nullable=False),
        sa.Column("updated_at", sa.String(), nullable=False),
    )

    op.create_table(
        "ingredients",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column(
            "brew_id", sa.Integer(), sa.ForeignKey("brews.id", ondelete="CASCADE"), nullable=False
        ),
        sa.Column("ingredient_name", sa.String(), nullable=False),
        sa.Column("amount", sa.Float(), nullable=True),
        sa.Column("unit", sa.String(), nullable=True),
        sa.Column("category", sa.String(), nullable=True),
        sa.Column("notes", sa.String(), nullable=True),
    )

    op.create_table(
        "gravity_readings",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column(
            "brew_id", sa.Integer(), sa.ForeignKey("brews.id", ondelete="CASCADE"), nullable=False
        ),
        sa.Column("reading_date", sa.String(), nullable=False),
        sa.Column("specific_gravity", sa.Float(), nullable=False),
        sa.Column("temperature", sa.Float(), nullable=True),
        sa.Column("temperature_unit", sa.String(), nullable=True, server_default="°F"),
        sa.Column("notes", sa.String(), nullable=True),
    )


def downgrade() -> None:
    op.drop_table("gravity_readings")
    op.drop_table("ingredients")
    op.drop_table("brews")
