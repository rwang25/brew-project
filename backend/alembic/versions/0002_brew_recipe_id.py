"""replace brews.cloned_from_id with brews.recipe_id

Revision ID: 0002_brew_recipe_id
Revises: 0001_mead_features
Create Date: 2026-07-20

"""
from typing import Sequence, Union

import sqlalchemy as sa

from alembic import op

revision: str = "0002_brew_recipe_id"
down_revision: Union[str, Sequence[str], None] = "0001_mead_features"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    with op.batch_alter_table("brews") as batch_op:
        batch_op.drop_column("cloned_from_id")
        batch_op.add_column(sa.Column("recipe_id", sa.Integer(), nullable=True))


def downgrade() -> None:
    with op.batch_alter_table("brews") as batch_op:
        batch_op.drop_column("recipe_id")
        batch_op.add_column(sa.Column("cloned_from_id", sa.Integer(), nullable=True))
