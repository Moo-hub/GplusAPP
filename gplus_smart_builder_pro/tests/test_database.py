import pytest

pytestmark = pytest.mark.asyncio
from gplus_smart_builder_pro.src.database import Base, SyncSessionLocal, sync_engine
from sqlalchemy import inspect

def test_database_tables():
    inspector = inspect(sync_engine)
    tables = inspector.get_table_names()
    assert isinstance(tables, list)

@pytest.mark.asyncio
async def test_get_db():
    from gplus_smart_builder_pro.src.database import get_db
    gen = get_db()
    session = await gen.__anext__()
    assert session is not None
    await session.close()
