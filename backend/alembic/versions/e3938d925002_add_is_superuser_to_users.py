"""add is_superuser to users

Revision ID: e3938d925002
Revises: 0001_initial
Create Date: 2025-10-10 15:07:26.000000

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = 'e3938d925002'
down_revision = '0001_initial'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Add is_superuser column to users table with server_default='0'
    # This ensures existing rows get a default value and are not NULL
    op.add_column('users', sa.Column('is_superuser', sa.Boolean(), server_default='0', nullable=False))


def downgrade() -> None:
    # Remove is_superuser column from users table
    op.drop_column('users', 'is_superuser')
