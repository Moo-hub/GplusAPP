#!/bin/bash
# create_api.sh - Creates a simple API project with GPlus Smart Builder Pro

# Set script to exit on error
set -e

echo "========================================="
echo "GPlus Smart Builder Pro - API Example"
echo "========================================="
echo ""

# Navigate to parent directory
cd "$(dirname "$0")/.."

# Create output directory if it doesn't exist
mkdir -p examples/output

# Generate the API project
echo "Creating API project 'MyAPI'..."
python app.py new MyAPI \
  -o examples/output \
  -c BackendFastAPI \
  -f docker=true \
  -f api_docs=true \
  -y

echo ""
echo "========================================="
echo "Project created successfully!"
echo "========================================="
echo ""
echo "Next steps:"
echo "1. cd examples/output/myapi"
echo "2. Check the README.md for setup instructions"
echo "3. Start developing your API!"
echo ""
