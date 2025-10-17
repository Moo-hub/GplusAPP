# GPlusApp - AI Coding Agent Instructions

## 1. Project Purpose & Business Logic
نظام بيئي متكامل لإدارة النفايات وإعادة التدوير يربط المستخدمين والسائقين والشركات ضمن منظومة بيئية ذكية. يحتوي على:

- **نظام نقاط الولاء (+G System)**: يكافئ المستخدمين حسب نشاطهم البيئي (تسليم النفايات القابلة للتدوير)
- **محفظة الكربون**: تخزين النقاط المستبدلة وتحويلها لمكافآت بيئية
- **لوحة تحكم الشركات**: تحليلات الأداء البيئي ومراقبة عمليات إعادة التدوير
- **نظام تتبع الطلبات**: متابعة رحلات جمع النفايات في الوقت الفعلي

## 2. Architecture Overview

**Stack**: FastAPI backend + PostgreSQL + Redis + Prometheus monitoring  
**Frontend**: React with Arabic-English i18n (RTL/LTR support)  
**Mobile**: Capacitor for iOS/Android with native bridge patterns  
**Environment**: Dockerized with secure `.env` configuration

### Backend (`backend/app/`)
- **FastAPI** with structured layering: `api/`, `core/`, `crud/`, `models/`, `schemas/`, `services/`
- **Database**: PostgreSQL with Alembic migrations (⚠️ NEVER use `Base.metadata.create_all()`)
- **Redis**: Smart fallback system - uses `InMemoryRedis` when Redis unavailable or `ENVIRONMENT=test`
- **Authentication**: JWT with refresh tokens, configurable expiry
- **Monitoring**: Prometheus metrics via `/metrics`, WebSocket manager for real-time updates

### Frontend (`frontend/src/`)
- **React** with routing, i18n (Arabic/English RTL support), context providers
- **MSW** (Mock Service Worker) automatically starts in dev mode for API mocking
- **Architecture**: Components organized by feature, shared contexts (`AuthContext`, `LoadingContext`)
- **Styling**: Tailwind CSS with theme provider
- **RTL Support**: All UI components must support RTL and dynamic language switching

### Module Interaction
- **Backend (FastAPI)**: APIs, authentication, Redis/PostgreSQL integration
- **Frontend (React)**: User interfaces for customers, drivers, and admin panels
- **Monitoring Layer**: Prometheus metrics, WebSocket real-time updates, performance analytics

## 3. Core Development Patterns

### Internationalization (i18n) Requirements
- **Mandatory RTL Support**: All UI components must handle Arabic (RTL) and English (LTR)
- **Dynamic Language Switching**: Use `i18n.changeLanguage()` with proper text direction updates
- **Toast & Error Messages**: Must support RTL layout in `react-toastify` configuration

### Environment-Specific Behavior
```python
# Test mode: SQLite + InMemoryRedis for hermetic tests
if settings.ENVIRONMENT == "test":
    # Backend uses sqlite:///./test.db and Redis fallbacks
    # Test helpers endpoints auto-included
```

### Offline-First Approach
- Local storage fallbacks for essential features when network unavailable
- Enhanced API layer with automatic retry and queue mechanisms
- Graceful degradation for non-critical functionality

### Database Migrations
```bash
# Always use Alembic, never direct table creation
alembic upgrade head
```

## 4. Development Workflows

### Backend Testing (Windows PowerShell)
```powershell
Set-Location backend
$env:ENVIRONMENT = 'test'
pytest -q  # Hermetic tests with SQLite + in-memory Redis
```
- Tests use `testpaths = tests` (avoids duplicate modules under `app/tests/`)
- Manual tests: `@pytest.mark.manual` - require `RUN_MANUAL_TESTS=1`

### Frontend Testing
```bash
npm run test:frontend  # Specific frontend services tests
npm run test:components  # Component tests with separate config
npm run test:basic  # Core functionality tests
```
- Multiple test configs: `vitest.config.js` (main), `vitest.components.config.js` (components)
- Uses Vitest with 60s timeouts, JSdom environment, MSW for API mocking

### Production Deployment
```bash
docker-compose -f docker-compose.dev.yml up
# Backend: localhost:8000, Frontend: localhost:3000
# Includes PostgreSQL, Redis, monitoring stack
```
- Production uses PostgreSQL + Redis + Prometheus monitoring
- Environment variables loaded via `.env` files (never commit these)
- Metrics and logging monitored via `/metrics` endpoint

### Performance & Monitoring
- Prometheus scrapes `/metrics` every 10s with alerting rules in `alerts/`
- Cypress performance tests available via `npm run cy:performance`

## 5. Domain Logic & Business Concepts

### +G Loyalty System
- **Points Earning**: Users gain +G points for recycling activities (waste submission, proper sorting)
- **Points Redemption**: Convert points to rewards, discounts, or carbon wallet credits
- **Carbon Wallet**: Stores eco-credits that can be used for environmental initiatives
- **Company Analytics**: Track recycling performance, environmental impact metrics

### Core Workflows
- **Pickup Requests**: Users request waste collection, drivers accept/complete orders
- **Real-time Tracking**: WebSocket updates for order status and driver location
- **Waste Categories**: Different point values for different recyclable materials
- **Environmental Impact**: Calculate carbon footprint reduction and rewards

## 6. Project-Specific Patterns

### Redis Client Pattern
```python
# Lazy Redis connection with graceful fallback
from app.core.redis_client import get_redis_client
client = get_redis_client()  # Returns InMemoryRedis if Redis unavailable
```

### Frontend Context Usage
```jsx
// Multi-provider pattern with error boundaries
<AuthProvider>
  <LoadingProvider>
    <ErrorProvider>
      <App />
```

### Test Environment Setup
- Backend: Set `ENVIRONMENT=test` for SQLite + Redis fallbacks
- Frontend: MSW auto-starts in dev, test utils in `src/test-utils/`

## 7. Critical Integration Points

### API Proxy Setup
```javascript
// vite.config.js - Frontend proxies /api to backend:8000
proxy: { '/api': { target: 'http://localhost:8000' } }
```

### Docker Development
```bash
docker-compose -f docker-compose.dev.yml up
# Backend: localhost:8000, Frontend: localhost:3000
# Includes PostgreSQL, Redis, monitoring stack
```

### WebSocket Management
- Centralized WebSocket manager in `app/api/websockets`
- Real-time updates for dashboard components

### Enhanced API Layer
- Toast integration for user feedback on all API operations
- Automatic offline detection and fallback strategies
- Request queuing and retry mechanisms for failed operations

## 8. Key Files to Understand
- `backend/app/core/redis_client.py` - Redis fallback system (critical pattern)
- `frontend/src/main.jsx` - MSW initialization and app entry point
- `backend/app/main.py` - FastAPI app with conditional test helpers

## 9. Common Pitfalls to Avoid
1. Don't use `Base.metadata.create_all()` - use Alembic migrations
2. Don't assume Redis is always available - use `get_redis_client()`
3. Test isolation requires `ENVIRONMENT=test` for proper SQLite/Redis fallbacks
4. Frontend tests need proper config file to avoid path resolution issues

## 10. Future Enhancements (Quick Overview)
- Carbon credit marketplaces & blockchain verification
- AI-based waste classification & community challenges  
- IoT sensors & ML route optimization

*See ROADMAP.md for detailed implementation plans*