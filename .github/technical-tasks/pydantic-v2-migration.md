# Pydantic V2 migration (ConfigDict / from_attributes)

Goal

Migrate Pydantic model configs from V1 style (e.g., `orm_mode = True`) to Pydantic V2 `ConfigDict` with `from_attributes=True` where applicable. Do this incrementally per model to minimize risk.

Checklist

- [ ] Inventory models using `orm_mode` or `update_forward_refs()`.
- [ ] Replace class-level `class Config:` with `model_config = ConfigDict(from_attributes=True)`.
- [ ] Replace usages of `update_forward_refs()` with `model_rebuild()` where necessary.
- [ ] Run tests and fix any field/validation discrepancies.
- [ ] Document migration changes in a dev note and link to PR.

Notes

- Pydantic V2 changed configuration keys; `orm_mode` is deprecated and replaced by `from_attributes` in `ConfigDict`.
- Use `mypy`/type-checking to detect subtle incompatibilities.
- Split the work into small PRs per feature area to keep CI fast and reviewable.
