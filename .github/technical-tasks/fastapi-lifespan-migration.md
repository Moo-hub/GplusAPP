# FastAPI Lifespan migration (replace on_event with lifespan)

Goal

Move startup/shutdown logic currently in `@app.on_event("startup")` / `@app.on_event("shutdown")` to a `lifespan` context manager function per FastAPI best practices.

Checklist

- [ ] Locate all uses of `@app.on_event("startup")` and `@app.on_event("shutdown")`.
- [ ] Implement a `lifespan` async context manager in `backend/app/main.py` that yields and registers resources.
- [ ] Remove deprecated decorators and ensure tests still pass.
- [ ] Document the change and rationale in the PR.

Notes

- FastAPI recommends using lifespan handlers for clearer, testable startup/shutdown lifecycle management.
- Make this change in a small PR to keep review simple.
