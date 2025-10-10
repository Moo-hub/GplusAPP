"""add is_superuser to users

Revision ID: e3938d925002
Revises: 82d0f66ad5d9
Create Date: 2025-10-10 17:46:54.480315

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'e3938d925002'
down_revision: Union[str, Sequence[str], None] = '82d0f66ad5d9'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    # Add `is_superuser` to the existing `users` table. Use server_default '0' so existing rows get a value.
    op.add_column(
        'users',
        sa.Column('is_superuser', sa.Boolean(), nullable=False, server_default=sa.text('0')),
    )
    # Remove the server default after backfilling is not necessary for sqlite, but leave as-is to keep migrations simple.


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_column('users', 'is_superuser')
