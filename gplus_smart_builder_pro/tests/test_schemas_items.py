from gplus_smart_builder_pro.src.schemas.items import Item, ItemBase, ItemCreate

def test_item_base():
    item = ItemBase(name="item", description="desc")
    assert item.name == "item"
    assert item.description == "desc"

def test_item_create():
    item = ItemCreate(name="item", description="desc")
    assert isinstance(item, ItemBase)

def test_item():
    item = Item(id=1, name="item", description="desc")
    assert item.id == 1
