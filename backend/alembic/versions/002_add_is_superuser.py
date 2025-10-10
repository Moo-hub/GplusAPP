"""Add is_superuser to users table

Revision ID: 002_add_is_superuser
Revises: 001_initial
Create Date: 2025-10-10 16:30:00.000000

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '002_add_is_superuser'
down_revision = '001_initial'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Add is_superuser column to users table
    op.add_column('users', sa.Column('is_superuser', sa.Boolean(), nullable=True, server_default='0'))


def downgrade() -> None:
    # Remove is_superuser column from users table
    op.drop_column('users', 'is_superuser')
