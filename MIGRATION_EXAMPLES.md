# Pydantic V2 Migration - Code Examples

This document shows before/after examples of the migration changes.

## Example 1: Simple Model with orm_mode

### Before (Pydantic V1)
```python
from pydantic import BaseModel

class Company(BaseModel):
    id: int
    name: str
    
    class Config:
        orm_mode = True
```

### After (Pydantic V2)
```python
from pydantic import BaseModel, ConfigDict

class Company(BaseModel):
    id: int
    name: str
    
    model_config = ConfigDict(from_attributes=True)
```

## Example 2: Model with Forward References

### Before (Pydantic V1)
```python
from pydantic import BaseModel

class PartnerWithRelations(Partner):
    redemption_options: List["RedemptionOption"] = []

# Import at the end to avoid circular imports
from app.schemas.redemption_option import RedemptionOption
PartnerWithRelations.update_forward_refs()
```

### After (Pydantic V2)
```python
from pydantic import BaseModel

class PartnerWithRelations(Partner):
    redemption_options: List["RedemptionOption"] = []

# Import at the end to avoid circular imports
from app.schemas.redemption_option import RedemptionOption
PartnerWithRelations.model_rebuild()
```

## Example 3: Model Already Using from_attributes

### Before (Pydantic V1 style with V2 config)
```python
from pydantic import BaseModel

class User(UserBase):
    id: int
    points: int
    created_at: datetime
    
    class Config:
        from_attributes = True
```

### After (Proper Pydantic V2)
```python
from pydantic import BaseModel, ConfigDict

class User(UserBase):
    id: int
    points: int
    created_at: datetime
    
    model_config = ConfigDict(from_attributes=True)
```

## Key Changes Summary

### 1. Import Changes
```python
# Add ConfigDict to imports
from pydantic import BaseModel, ConfigDict
```

### 2. Configuration Changes
```python
# Old V1 style
class Config:
    orm_mode = True

# New V2 style
model_config = ConfigDict(from_attributes=True)
```

### 3. Forward Reference Changes
```python
# Old V1 method
Model.update_forward_refs()

# New V2 method
Model.model_rebuild()
```

## Why These Changes?

1. **`orm_mode` → `from_attributes`**: More descriptive name that better explains what the setting does (allows creating models from ORM objects with attributes)

2. **`class Config` → `model_config`**: Cleaner, more Pythonic approach using a class variable instead of a nested class

3. **`update_forward_refs()` → `model_rebuild()`**: More accurate name that describes rebuilding the model's schema after forward references are resolved

## Compatibility Notes

- These changes are **required** when using Pydantic V2
- The old syntax will raise deprecation warnings or errors in Pydantic V2
- All functionality remains the same - only the configuration syntax changed
- SQLAlchemy ORM integration works identically with `from_attributes=True`

## Testing Your Migration

```python
# Test that models can be created from ORM objects
from sqlalchemy.orm import Session
from app.models import User as UserModel
from app.schemas import User as UserSchema

# This should work with from_attributes=True
db_user = session.query(UserModel).first()
user_schema = UserSchema.from_orm(db_user)  # V1 method
# OR
user_schema = UserSchema.model_validate(db_user)  # V2 method (preferred)
```

## Additional Resources

- [Pydantic V2 Migration Guide](https://docs.pydantic.dev/latest/migration/)
- [ConfigDict API Reference](https://docs.pydantic.dev/latest/api/config/)
- [Model Validation Methods](https://docs.pydantic.dev/latest/api/base_model/)
