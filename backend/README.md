# Sweet Shop - Backend

FastAPI backend for the Sweet Shop Management System.

Quick start (local SQLite):

1. Create a virtualenv and install deps:

```powershell
python -m venv .venv; .\.venv\Scripts\Activate; pip install -r backend/requirements.txt
```

2. Run the server:

```powershell
uvicorn backend.app.main:app --reload
```

3. Run tests:

```powershell
pytest -q
```

Configuration:
- `DATABASE_URL` env var to point to PostgreSQL in production
- `SECRET_KEY` to override default dev secret

