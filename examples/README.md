# GPlus Smart Builder Pro - Examples

This directory contains examples demonstrating how to use GPlus Smart Builder Pro.

## Quick Start Examples

### Example 1: Create a Simple API Project

```bash
python ../app.py new MyAPI \
  -o ./output \
  -c BackendFastAPI \
  -f docker=true \
  -f api_docs=true \
  -y
```

This creates a FastAPI backend with Docker support and API documentation.

### Example 2: Full-Stack Web Application

```bash
python ../app.py new FullStackApp \
  -o ./output \
  -c BackendFastAPI \
  -c FrontendReact \
  -c DocsMkDocs \
  -f docker=true \
  -f ci_cd=true \
  -y
```

This creates a complete full-stack application with:
- FastAPI backend
- React frontend
- MkDocs documentation
- Docker containers
- CI/CD pipeline

### Example 3: Documentation-Only Project

```bash
python ../app.py new MyProjectDocs \
  -o ./output \
  -c DocsMkDocs \
  -y
```

This creates a standalone documentation site using MkDocs.

### Example 4: Interactive Mode (Arabic)

```bash
python ../app.py --lang ar new مشروعي
```

This runs the interactive project creation in Arabic.

### Example 5: With Custom Values

```bash
python ../app.py new MyCustomProject \
  -o ./output \
  -c BackendFastAPI \
  -v port=8080 \
  -v database=postgresql \
  -f docker=true \
  -y
```

## Running the Examples

1. Navigate to this directory:
   ```bash
   cd examples
   ```

2. Run any of the example scripts:
   ```bash
   bash create_api.sh
   ```

3. Check the output in `./output` directory

## Scripts Provided

- `create_api.sh` - Creates a simple API project
- `create_fullstack.sh` - Creates a full-stack application
- `create_docs.sh` - Creates a documentation site
- `interactive_demo.sh` - Runs an interactive demonstration

## Notes

- All examples use the `-y` flag to skip confirmations
- Output is directed to `./output` directory
- You can modify these examples for your needs
- Check `../README.md` for more details

## Cleanup

To clean up generated projects:

```bash
rm -rf ./output/*
```

## Help

For more help:
```bash
python ../app.py --help
python ../app.py new --help
python ../app.py about
```
