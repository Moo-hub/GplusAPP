CI Guide — Split pipeline & accessibility tests
=============================================

This repo uses a two-stage CI pipeline to keep test runs fast and robust:

- unit-tests: fast unit & integration tests without native toolchains.
- accessibility-tests: axe/jsdom UI tests that may need node-canvas.

Pipeline flow
------------

1. The `unit_tests` job runs first and validates core logic quickly.
2. The `a11y_tests` job runs after `unit_tests` and attempts to build `canvas` (it will not fail if build isn't possible).

Skipping accessibility tests
---------------------------

- The `a11y_tests` job is safe: it attempts to install `canvas` but the job won't hard-fail when canvas can't be compiled.
- To skip `a11y_tests` entirely, comment out the job in `.github/workflows/ci.yml` or add a workflow condition (e.g., based on a PR label).

Local setup for canvas (Debian/Ubuntu)
-------------------------------------

Run these commands locally if you want to build `canvas` and run a11y tests:

```bash
sudo apt-get update
sudo apt-get install -y \
  build-essential \
  libcairo2-dev \
  libpango1.0-dev \
  libjpeg-dev \
  libgif-dev \
  librsvg2-dev \
  libfreetype6-dev
```

Docker
------

Use `docker/Dockerfile.canvas` to replicate CI environment locally. It installs the same system deps and runs frontend tests.

Notes and tips
--------------

- `canvas` is listed under `optionalDependencies` in `frontend/package.json` so local installs can opt in without forcing CI to fail.
- The `a11y_tests` job captures accessibility test output and uses a small retry to reduce flakes.
CI Guide — Split pipeline and a11y tests
======================================

This repo uses a two-stage CI pipeline to keep the test run fast and stable:

- `unit_tests`: fast unit & integration tests that do not require native toolchains.
- `a11y_tests`: accessibility and UI tests (axe/jsdom) which may need `node-canvas`.

How it works
-----------

1. `unit_tests` runs first and validates core logic quickly.
2. `a11y_tests` runs only after `unit_tests` and installs system packages required for `node-canvas`.

Opting in/out
------------

- The `a11y_tests` job is part of the normal pipeline but it is safe to skip: it attempts to install `canvas` and will not fail if building it is not possible.
- To completely skip `a11y_tests`, you can set a commit message or PR label and adapt the workflow, or temporarily comment out the job in `.github/workflows/ci.yml`.

Local dev: installing system deps
--------------------------------

On Debian/Ubuntu you can install the dependencies used by CI with:

```bash
sudo apt-get update
sudo apt-get install -y build-essential libcairo2-dev libpango1.0-dev libjpeg-dev libgif-dev librsvg2-dev libfreetype6-dev
```

If you prefer Docker, use `docker/Dockerfile.canvas` which contains the same installation steps and runs the frontend tests.

Notes
-----

- `canvas` is listed under `optionalDependencies` in `frontend/package.json`. Local devs can `npm install` it for a full experience; CI will attempt to build it but won't fail the job if it can't.
- The `a11y_tests` job uploads accessibility test artifacts and runs with a small retry to reduce flakes.
CI Guide — Split pipeline and a11y tests
======================================

This repo uses a two-stage CI pipeline to keep the test run fast and stable:

- `unit_tests`: fast unit & integration tests that do not require native toolchains.
- `a11y_tests`: accessibility and UI tests (axe/jsdom) which may need `node-canvas`.

How it works
-----------

1. `unit_tests` runs first and validates core logic quickly.
2. `a11y_tests` runs only after `unit_tests` and installs system packages required for `node-canvas`.

Opting in/out
------------

- The `a11y_tests` job is part of the normal pipeline but it is safe to skip: it attempts to install `canvas` and will not fail if building it is not possible.
- To completely skip `a11y_tests`, you can set a commit message or PR label and adapt the workflow, or temporarily comment out the job in `.github/workflows/ci.yml`.

Local dev: installing system deps
--------------------------------

On Debian/Ubuntu you can install the dependencies used by CI with:

```bash
sudo apt-get update
sudo apt-get install -y build-essential libcairo2-dev libpango1.0-dev libjpeg-dev libgif-dev librsvg2-dev libfreetype6-dev
```

If you prefer Docker, use `docker/Dockerfile.canvas` which contains the same installation steps and runs the frontend tests.

Notes
-----
- `canvas` is listed under `optionalDependencies` in `frontend/package.json`. Local devs can `npm install` it for a full experience; CI will attempt to build it but won't fail the job if it can't.
- The `a11y_tests` job uploads accessibility test artifacts and runs with a small retry to reduce flakes.
