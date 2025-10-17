"""add_pickup_scheduling_enhancements

Revision ID: 3921ccaf9e39
Revises: 5fdbbbf32a86
Create Date: 2025-09-28 01:15:35.128910

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql
import sys
import os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))
from utils import add_column_if_not_exists

# revision identifiers, used by Alembic.
revision: str = '3921ccaf9e39'
down_revision: Union[str, Sequence[str], None] = '5fdbbbf32a86'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    # Create enum type first
    recurrence_type = sa.Enum('NONE', 'WEEKLY', 'BI_WEEKLY', 'MONTHLY', name='recurrencetype')
    recurrence_type.create(op.get_bind(), checkfirst=True)
    
    # Add columns
    add_column_if_not_exists('pickup_requests', sa.Column('time_slot', sa.String(), nullable=True))
    add_column_if_not_exists('pickup_requests', sa.Column('recurrence_type', sa.Enum('NONE', 'WEEKLY', 'BI_WEEKLY', 'MONTHLY', name='recurrencetype'), nullable=False, server_default='NONE'))
    add_column_if_not_exists('pickup_requests', sa.Column('recurrence_end_date', sa.DateTime(timezone=True), nullable=True))
    add_column_if_not_exists('pickup_requests', sa.Column('is_recurring', sa.Boolean(), server_default='false', nullable=False))
    add_column_if_not_exists('pickup_requests', sa.Column('calendar_event_id', sa.String(), nullable=True))


def downgrade() -> None:
    """Downgrade schema."""
    # Remove columns first
    op.drop_column('pickup_requests', 'calendar_event_id')
    op.drop_column('pickup_requests', 'is_recurring')
    op.drop_column('pickup_requests', 'recurrence_end_date')
    op.drop_column('pickup_requests', 'recurrence_type')
    op.drop_column('pickup_requests', 'time_slot')
    
    # Drop enum type
    sa.Enum(name='recurrencetype').drop(op.get_bind())