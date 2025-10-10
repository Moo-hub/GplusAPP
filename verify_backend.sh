#!/bin/bash
# Verification script for backend setup

set -e

echo "=== Backend Verification Script ==="
echo ""

# Check Python version
echo "1. Checking Python version..."
python3 --version

# Check required files exist
echo ""
echo "2. Checking required files..."
files=(
    "backend/src/main.py"
    "backend/src/models/user.py"
    "backend/alembic/versions/e3938d925002_add_is_superuser_to_users.py"
    "backend/README.md"
    ".github/workflows/backend-ci.yml"
)

for file in "${files[@]}"; do
    if [ -f "$file" ]; then
        echo "  ✓ $file"
    else
        echo "  ✗ $file (MISSING)"
        exit 1
    fi
done

# Check Python syntax
echo ""
echo "3. Checking Python syntax..."
python3 -m py_compile backend/src/*.py backend/src/models/*.py backend/tests/*.py
echo "  ✓ All Python files have valid syntax"

# Check Alembic migrations
echo ""
echo "4. Checking Alembic migrations..."
cd backend
alembic history
cd ..

# Verify migration can be applied
echo ""
echo "5. Testing migration application..."
cd backend
export DATABASE_URL="sqlite:///./test_verify.db"
alembic upgrade head

# Verify database schema
python3 << 'EOF'
from sqlalchemy import create_engine, inspect
import os

engine = create_engine(os.environ.get('DATABASE_URL'))
inspector = inspect(engine)
columns = [col['name'] for col in inspector.get_columns('users')]

assert 'is_superuser' in columns, 'is_superuser column not found!'
print("  ✓ Database schema verified - is_superuser column exists")
EOF

# Cleanup
rm -f test_verify.db
cd ..

echo ""
echo "=== ✓ All verifications passed! ==="
