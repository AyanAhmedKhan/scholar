"""add batch fields to scholarships

Revision ID: add_batch_fields
Revises: a585200efa64
Create Date: 2024-01-01 12:00:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import mysql

# revision identifiers, used by Alembic.
revision = 'add_batch_fields'
down_revision = '33a99ffa1a7f'  # Updated to point to latest migration
branch_labels = None
depends_on = None


def upgrade():
    # Add batch management fields to scholarships table
    op.add_column('scholarships', sa.Column('allowed_batches_new', sa.JSON(), nullable=True))
    op.add_column('scholarships', sa.Column('allowed_batches_renewal', sa.JSON(), nullable=True))
    op.add_column('scholarships', sa.Column('is_renewable', sa.Boolean(), nullable=True, server_default='0'))


def downgrade():
    op.drop_column('scholarships', 'is_renewable')
    op.drop_column('scholarships', 'allowed_batches_renewal')
    op.drop_column('scholarships', 'allowed_batches_new')

