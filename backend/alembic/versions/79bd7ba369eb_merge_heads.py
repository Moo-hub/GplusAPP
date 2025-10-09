"""merge_heads

Revision ID: 79bd7ba369eb
Revises: 2921ccaf9e38, 3921ccaf9e39
Create Date: 2025-09-28 04:59:09.070702

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '79bd7ba369eb'
down_revision: Union[str, Sequence[str], None] = ('2921ccaf9e38', '3921ccaf9e39')
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    pass


def downgrade() -> None:
    """Downgrade schema."""
    pass
