#!/bin/bash
# create_docs.sh - Creates a documentation site with GPlus Smart Builder Pro

# Set script to exit on error
set -e

echo "================================================"
echo "GPlus Smart Builder Pro - Documentation Example"
echo "================================================"
echo ""

# Navigate to parent directory
cd "$(dirname "$0")/.."

# Create output directory if it doesn't exist
mkdir -p examples/output

# Generate the documentation project
echo "Creating documentation project 'MyProjectDocs'..."
python app.py new MyProjectDocs \
  -o examples/output \
  -c DocsMkDocs \
  -y

echo ""
echo "================================================"
echo "Project created successfully!"
echo "================================================"
echo ""
echo "Your documentation site is ready!"
echo ""
echo "Next steps:"
echo "1. cd examples/output/myprojectdocs"
echo "2. Install MkDocs: pip install mkdocs mkdocs-material"
echo "3. Run 'mkdocs serve' to preview your documentation"
echo "4. Edit docs in the 'docs/' folder"
echo ""
