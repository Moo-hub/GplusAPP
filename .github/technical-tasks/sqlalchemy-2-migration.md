# SQLAlchemy 2.0 migration (declarative_base / as_declarative)

Goal

Update imports and patterns to SQLAlchemy 2.0 idioms (e.g., `sqlalchemy.orm.declarative_base()` and `sqlalchemy.orm.as_declarative`) and remove deprecated references.

Checklist

- [ ] Inventory uses of `declarative_base()` and `as_declarative()` from old locations.
- [ ] Replace imports to use `from sqlalchemy.orm import declarative_base, as_declarative`.
- [ ] Run tests and fix any ORM mapping issues.
- [ ] Document migration notes and link to PRs.

Notes

- SQLAlchemy 2.0 moved several API entry points to `sqlalchemy.orm`.
- Keep changes small and well-tested; do not change runtime behavior in a single large PR.
- Prefer splitting per module or per feature area.
