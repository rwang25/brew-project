"""add container and color overrides to ingredient_prices

Revision ID: 0004_price_container_color
Revises: 0003_cascade_deletes
Create Date: 2026-10-14

"""
from typing import Sequence, Union

import sqlalchemy as sa

from alembic import op

revision: str = "0004_price_container_color"
down_revision: Union[str, Sequence[str], None] = "0003_cascade_deletes"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    with op.batch_alter_table("ingredient_prices") as batch_op:
        batch_op.add_column(sa.Column("container", sa.String(), nullable=True))
        batch_op.add_column(sa.Column("color", sa.String(), nullable=True))


def downgrade() -> None:
    with op.batch_alter_table("ingredient_prices") as batch_op:
        batch_op.drop_column("color")
        batch_op.drop_column("container")
