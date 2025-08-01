```markdown
# Getting Started

This guide will help you set up and run the {{ project.name }} project on your local machine.

## Prerequisites

Before you begin, ensure you have the following installed:

* **Python 3.9+**
* **Node.js (LTS version)**
* **npm or Yarn**
* **Git**

## Installation Steps

1.  **Clone the Repository:**
    ```bash
    git clone [https://github.com/](https://github.com/){{ project.author }}/{{ project.slug }}.git # Example
    cd {{ project.slug }}
    ```

2.  **Backend Setup (FastAPI):**
    Follow the instructions in `backend/{{ project.slug }}-api/README.md`.

3.  **Frontend Setup (React):**
    Follow the instructions in `frontend/{{ project.slug }}-web/README.md`.

## Running the Project

To run the full application, you typically need to start the backend and frontend separately:

1.  **Start Backend (in its directory):**
    ```bash
    cd backend/{{ project.slug }}-api
    source .venv/bin/activate # or .venv\Scripts\activate on Windows
    uvicorn src.main:app --reload
    ```

2.  **Start Frontend (in its directory):**
    ```bash
    cd frontend/{{ project.slug }}-web
    npm run dev
    ```

You should now be able to access the frontend application in your browser (usually `http://localhost:3000`) and it will communicate with the backend.