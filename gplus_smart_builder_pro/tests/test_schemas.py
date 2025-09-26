from gplus_smart_builder_pro.src.schemas import Item, ItemBase, ItemCreate

def test_item_schema():
    data = {"id": 1, "name": "Test", "description": "desc"}
    item = Item(**data)
    assert item.id == 1
    assert item.name == "Test"
    assert item.description == "desc"
    assert item.dict()["name"] == "Test"

def test_item_base_schema():
    data = {"name": "Test", "description": "desc"}
    base = ItemBase(**data)
    assert base.name == "Test"
    assert base.description == "desc"

def test_item_create_schema():
    data = {"name": "Test", "description": "desc"}
    create = ItemCreate(**data)
    assert create.name == "Test"
    assert create.description == "desc"
