#!/bin/bash
# create_fullstack.sh - Creates a full-stack application with GPlus Smart Builder Pro

# Set script to exit on error
set -e

echo "================================================"
echo "GPlus Smart Builder Pro - Full-Stack Example"
echo "================================================"
echo ""

# Navigate to parent directory
cd "$(dirname "$0")/.."

# Create output directory if it doesn't exist
mkdir -p examples/output

# Generate the full-stack project
echo "Creating full-stack project 'FullStackApp'..."
python app.py new FullStackApp \
  -o examples/output \
  -c BackendFastAPI \
  -c FrontendReact \
  -c DocsMkDocs \
  -f docker=true \
  -f ci_cd=true \
  -f redis=true \
  -y

echo ""
echo "================================================"
echo "Project created successfully!"
echo "================================================"
echo ""
echo "Your full-stack application includes:"
echo "  - FastAPI backend"
echo "  - React frontend"
echo "  - MkDocs documentation"
echo "  - Docker containers"
echo "  - GitHub Actions CI/CD"
echo "  - Redis caching"
echo ""
echo "Next steps:"
echo "1. cd examples/output/fullstackapp"
echo "2. Check the README.md for setup instructions"
echo "3. Run 'docker-compose up' to start all services"
echo ""
