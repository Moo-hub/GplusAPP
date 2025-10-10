# Quick Start Guide: is_superuser Migration

## 🚀 Quick Setup (New Database)

```bash
# 1. Navigate to backend directory
cd backend

# 2. Install dependencies
pip install -r requirements.txt

# 3. Apply all migrations
alembic upgrade head

# 4. Verify setup
python tmp_test_login_trace.py
```

## 🔄 Upgrade Existing Database

```bash
# 1. Navigate to backend directory
cd backend

# 2. Stamp database at initial revision (if not already stamped)
alembic stamp 0001_initial

# 3. Apply the is_superuser migration
alembic upgrade head

# 4. Verify the migration
python tmp_test_login_trace.py
```

## ✅ What You Get

After running the migration, your `users` table will have:

| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| id | INTEGER | No | Auto |
| email | VARCHAR | Yes | - |
| hashed_password | VARCHAR | Yes | - |
| is_active | BOOLEAN | Yes | - |
| **is_superuser** | **BOOLEAN** | **No** | **'0'** |

## 🎯 Key Benefits

1. ✅ **Non-destructive**: Existing rows automatically get `is_superuser = False`
2. ✅ **Data integrity**: NOT NULL constraint prevents invalid states
3. ✅ **Reversible**: Can downgrade if needed: `alembic downgrade -1`
4. ✅ **Prevents errors**: No more OperationalError on user queries

## 📋 Migration Commands

```bash
# Check current version
alembic current

# View migration history
alembic history

# Upgrade to latest
alembic upgrade head

# Downgrade one version
alembic downgrade -1

# Downgrade to specific version
alembic downgrade 0001_initial
```

## 🧪 Testing

```bash
# Test 1: Schema verification
python tmp_test_login_trace.py

# Test 2: Login functionality
python demo_login_test.py
```

## 📝 Notes

- Database file: `backend.db` (SQLite)
- Migration ID: `e3938d925002`
- Parent migration: `0001_initial`
- Always use Alembic for schema changes (see README.md)
