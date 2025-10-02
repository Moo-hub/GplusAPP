# Command Line Interface (CLI) Guide

The GPlus Recycling App comes with a comprehensive command-line interface to help manage and operate the application. This guide covers all available commands and options.

## Basic Usage

```bash
python gplus.py <command> [options]
```

## Available Commands

### Environment Management

#### Start Development Environment

```bash
python gplus.py start-dev
```

Starts the development environment using Docker Compose with hot reloading enabled for both frontend and backend.

#### Stop Development Environment

```bash
python gplus.py stop-dev
```

Stops all running development containers while preserving data.

#### Reset Development Environment

```bash
python gplus.py reset-dev
```

Stops all containers and removes volumes, effectively resetting the development environment to its initial state.

### Database Management

#### Setup Database

```bash
python gplus.py setup-db
```

Initializes the database with necessary tables and initial data. This command is idempotent and safe to run multiple times.

#### Migrate Database

```bash
python gplus.py migrate
```

Runs database migrations to update the schema based on the latest changes. This uses Alembic under the hood.

#### Create Migration

```bash
python gplus.py create-migration "description of change"
```

Creates a new database migration file with the provided description.

### Code Generation

#### Generate Module

```bash
python gplus.py module --name <module_name>
```

Generates a new module with basic structure and files.

**Options:**
- `--name` (required): Name of the module to create
- `--path` (optional): Path where the module should be created (default: backend/app/modules)

#### Generate Resource

```bash
python gplus.py scaffold --resource <resource_name> [options]
```

Scaffolds a complete resource with controllers, models, and services.

**Options:**
- `--resource` (required): Name of the resource to scaffold
- `--with-router` (flag): Include a router file
- `--with-service` (flag): Include a service file
- `--with-schema` (flag): Include Pydantic schemas
- `--with-model` (flag): Include SQLAlchemy model
- `--with-tests` (flag): Include test files for the resource

Example:
```bash
python gplus.py scaffold --resource company --with-router --with-service --with-schema --with-model --with-tests
```

### Testing and Quality

#### Run Tests

```bash
python gplus.py test [module]
```

Runs tests for the specified module or all tests if no module is specified.

**Options:**
- `module` (optional): Specific module to test

#### Lint Code

```bash
python gplus.py lint
```

Runs linters (black, isort, flake8) on the codebase and reports issues.

#### Format Code

```bash
python gplus.py format
```

Automatically formats code using black and isort.

### Production Management

#### Start Production

```bash
python gplus.py start-prod
```

Starts the production environment using Docker Compose with optimized settings.

#### Deploy

```bash
python gplus.py deploy [environment]
```

Deploys the application to the specified environment.

**Options:**
- `environment` (optional): Environment to deploy to (default: production)

### Utilities

#### Generate Secret

```bash
python gplus.py generate-secret
```

Generates a secure random secret key for use in configuration.

#### Show Logs

```bash
python gplus.py logs [service]
```

Shows logs for all services or a specific service if specified.

**Options:**
- `service` (optional): Specific service to show logs for (e.g., backend, frontend)

#### Health Check

```bash
python gplus.py health-check
```

Performs a health check on all services and reports their status.

## Environment Variables

The CLI respects the following environment variables:

- `GPLUS_ENV`: Environment (development, testing, production)
- `GPLUS_CONFIG_PATH`: Path to configuration file
- `GPLUS_LOG_LEVEL`: Log level (DEBUG, INFO, WARNING, ERROR)