# Project Fixes Implementation Plan

## Execution Order

### Phase 1: Cleanup (Safe Operations)
1. ✅ Remove temporary/debug files
2. ✅ Remove duplicate config files
3. ✅ Update .gitignore

### Phase 2: Configuration Files
4. ✅ Create backend/.env.example
5. ✅ Create frontend/.env.example
6. ✅ Create backend/requirements-dev.txt

### Phase 3: Dependency Updates
7. ✅ Update frontend/package.json (axios, vite, remove react-query)
8. ✅ Update root package.json

### Phase 4: Documentation
9. ✅ Create monitoring setup guide
10. ✅ Update README with fixes

## Files to Remove

### Temporary/Debug Files
- backend/tmp_debug_pickup_post.py
- backend/tmp_check_bcrypt.py

### Duplicate Config Files (Root Level)
- package.json.bak
- package.json.new
- temp-package.json
- vitest.setup.js.bak
- vitest-basic.config.js
- vitest-browser.config.js
- vitest.components.config.cjs
- vitest.components.config.js
- vitest.conf.js
- vitest.react.config.js
- vitest.simple.config.js
- vitest.test.config.js
- vite.config.ts (duplicate)
- vitest.config.ts (duplicate)
- tmp.vitest.config.js (in frontend)

### Test Files at Root (Should be in frontend/)
- basic-react-simple.test.jsx
- basic-react.test.jsx
- basic-test.js
- basic.test.js
- react-component.test.jsx
- react-element.test.jsx
- react-jsx-test.jsx
- react-jsx.test.jsx

## Dependencies to Update

### Frontend
- axios: ^0.27.2 → ^1.7.7
- vite: ^2.9.12 → ^5.4.11
- Remove: react-query (deprecated, using @tanstack/react-query)

### Root
- Clean up duplicate dependencies

## Status: READY TO EXECUTE
