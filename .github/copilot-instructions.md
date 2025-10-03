# AI Coding Instructions for GPlus Recycling App

## Project Architecture

**Full-Stack Application**: This is a recycling management system with:
- **Frontend**: React 18 + Vite (in `frontend/`)
- **Backend**: FastAPI + SQLAlchemy (in `backend/app/`)
- **Database**: PostgreSQL with Alembic migrations
- **Infrastructure**: Docker Compose with Redis, Prometheus monitoring, Grafana dashboards

## Key Development Patterns

### Frontend Architecture
- **Bilingual Support**: Arabic/English with RTL support using `react-i18next`
  - Translation files in `frontend/src/i18n/locales/`
  - Use `useTranslation()` hook consistently
- **API Integration**: Centralized API service with automatic request tracking
  - `frontend/src/services/api.js` - axios instance with interceptors
  - API calls tracked in `apiCallsInProgress` Set for global loading states
- **Context Pattern**: Authentication and app state managed via React contexts
  - `frontend/src/contexts/AuthContext.jsx` - handles WebSocket connections
  - WebSocket service for real-time updates in `frontend/src/services/websocket.service.js`

### Backend Architecture
- **FastAPI Structure**: Standard domain-driven design in `backend/app/`
  - `api/` - route handlers, `models/` - SQLAlchemy, `schemas/` - Pydantic
  - `crud/` - data access layer, `services/` - business logic
- **Monitoring**: Prometheus metrics at `/metrics` endpoint
- **Redis Integration**: Background tasks and caching with lifespan events
- **Development Mode**: Redis lifespan disabled in development environment

### Testing Strategy
- **Multi-Level Testing**: Unit (Vitest), Component (Testing Library), E2E (Cypress)
- **Accessibility Testing**: `jest-axe` integration with custom `test:a11y` scripts
- **Performance Testing**: Custom performance monitoring with baseline comparisons
- **Visual Regression**: Cypress visual testing with baseline screenshots

## Development Workflows

### Build Commands
```bash
# Frontend development
cd frontend && npm run dev           # Vite dev server
npm run test:a11y                   # Accessibility tests
npm run test:components             # Component-specific tests

# Docker deployment
docker-compose up -d                # Full stack
docker-compose -f docker-compose.dev.yml up  # Development mode
```

### Testing Commands
- Use project-specific test runners: `npm run test:basic` for core tests
- Performance tests: `npm run test:performance:update-baseline` to update benchmarks
- Cypress with custom reporters in `cypress/reporters/` directory

## Project-Specific Conventions

### Accessibility-First Design
- **ScreenReaderOnly Component**: Use `frontend/src/components/ScreenReaderOnly.jsx` for hidden text
- **Keyboard Navigation**: All interactive elements must support tab navigation
- **ARIA Labels**: Required for all form inputs and interactive components

### Internationalization Requirements
- All user-facing text must use translation keys
- Support Arabic RTL layout - check CSS for `direction: rtl` considerations
- Date/time formatting must respect locale settings

### State Management Patterns
- **Global Loading**: Use `apiCallsInProgress` Set rather than individual loading states
- **Error Handling**: Centralized error boundaries with `ErrorBoundary.jsx`
- **WebSocket State**: Real-time connection status managed in AuthContext

### File Organization
- **Component Co-location**: CSS files alongside JSX components
- **Feature Grouping**: Related components in feature directories (`dashboard/`, `charts/`)
- **Test Co-location**: `__tests__/` directories within each feature folder

## Integration Points

### API Communication
- **Base URL**: Environment-driven via `VITE_API_URL` or defaults to `localhost:8000/api/v1`
- **Authentication**: Bearer token in Authorization header, auto-managed by interceptors
- **CSRF Protection**: X-CSRF-Token header for non-GET requests

### Monitoring & Observability
- **Prometheus Metrics**: Custom business metrics in backend routes
- **Log Aggregation**: Structured logging with correlation IDs
- **Health Checks**: `/health` endpoint with dependency checks

### Database Migrations
- **Alembic**: Database schema versioning in `backend/alembic/`
- **Auto-generation**: Use `alembic revision --autogenerate` for model changes

## Common Gotchas

1. **Dual Package.json**: Root-level and frontend-specific - ensure correct directory for npm commands
2. **Environment Variables**: Backend uses Python-dotenv, frontend uses Vite env variables
3. **CSS Modules**: Some components use CSS modules pattern - import styles as objects
4. **WebSocket Lifecycle**: Connected/disconnected based on authentication state
5. **Test Environment**: Vitest configuration varies by test type - check config files in root