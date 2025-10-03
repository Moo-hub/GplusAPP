#!/bin/bash
# interactive_demo.sh - Interactive demonstration of GPlus Smart Builder Pro

echo "================================================"
echo "GPlus Smart Builder Pro - Interactive Demo"
echo "================================================"
echo ""
echo "This script will demonstrate the capabilities of"
echo "GPlus Smart Builder Pro by creating different"
echo "types of projects."
echo ""

# Navigate to parent directory
cd "$(dirname "$0")/.."

# Show about information
echo "1. Showing application information..."
echo "================================================"
python app.py about
echo ""
echo "Press Enter to continue..."
read

# Show help
echo ""
echo "2. Available commands..."
echo "================================================"
python app.py --help
echo ""
echo "Press Enter to continue..."
read

# Show new command help
echo ""
echo "3. Project generation options..."
echo "================================================"
python app.py new --help
echo ""
echo "Press Enter to continue..."
read

# Demonstrate language support
echo ""
echo "4. Arabic language support..."
echo "================================================"
python app.py --lang ar about
echo ""
echo "Press Enter to continue..."
read

echo ""
echo "================================================"
echo "Demo complete!"
echo "================================================"
echo ""
echo "To create your own project, run:"
echo "  python app.py new YourProjectName"
echo ""
echo "For more examples, check the other scripts in this directory:"
echo "  - create_api.sh       : Create an API project"
echo "  - create_fullstack.sh : Create a full-stack application"
echo "  - create_docs.sh      : Create a documentation site"
echo ""
