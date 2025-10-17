# {{ project.name }} - Shared Components

This directory (`shared/{{ project.slug }}-common`) is intended to house common code, utilities, models, or configurations that can be shared across multiple parts of your monorepo, such as between the backend and frontend, or other services.

## Purpose

* **Code Reusability:** Avoid duplicating code across different services/components.
* **Centralized Definitions:** Define common data models, enums, or constants in one place.
* **Consistency:** Ensure consistent behavior and data structures across your application.

## Contents (Examples)

* `utils/`: General utility functions (e.g., date helpers, string manipulators).
* `models/`: Shared Pydantic or TypeScript models that might be used by both backend (for validation) and frontend (for data structures).
* `config/`: Common configuration settings.
* `types/`: TypeScript type definitions.

## Usage

Components that need to use shared code can import directly from this directory. In a Python context, you might add this directory to `PYTHONPATH` or install it as an editable package. In a Node.js/JavaScript context, you might use npm workspaces or direct relative imports.

---

**Note:** This is a basic template. You will populate it with your actual shared code as your project grows.
