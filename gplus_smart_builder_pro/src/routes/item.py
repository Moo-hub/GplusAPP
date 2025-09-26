from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from .. import database, models, schemas

router = APIRouter()


@router.get("/items", response_model=list[schemas.Item])
def read_items(db: Session = Depends(database.get_db)):
    return db.query(models.item.Item).all()


@router.post("/items", response_model=schemas.Item)
def create_item(
    item: schemas.ItemCreate, db: Session = Depends(database.get_db)
):
    db_item = models.item.Item(name=item.name, description=item.description)
    db.add(db_item)
    db.commit()
    db.refresh(db_item)
    return db_item


@router.get("/items/{item_id}", response_model=schemas.Item)
def read_item(item_id: int, db: Session = Depends(database.get_db)):
    db_item = (
        db.query(models.item.Item)
        .filter(models.item.Item.id == item_id)
        .first()
    )
    if db_item is None:
        raise HTTPException(status_code=404, detail="Item not found")
    return db_item
