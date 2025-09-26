from gplus_smart_builder_pro.src.models.item import Item

def test_item_model():
    item = Item(id=1, name="Test", description="desc")
    assert item.id == 1
    assert item.name == "Test"
    assert item.description == "desc"
