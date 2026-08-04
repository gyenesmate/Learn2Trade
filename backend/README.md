# Learn2Trade Backend

FastAPI API for Learn2Trade. PostgreSQL runs in Docker; the API runs locally on Windows.

## Prerequisites

- Python 3.9+
- Docker / Docker Compose
- A virtual environment under `backend/.venv` (or `backend/venv`)

## Start PostgreSQL

From the repository root:

```powershell
docker compose up -d
```

Confirm the container is healthy before starting the API.

## Virtual environment (Windows)

```powershell
cd backend
.\.venv\Scripts\Activate.ps1
```

If your environment folder is still named `venv`:

```powershell
.\venv\Scripts\Activate.ps1
```

Install dependencies (first time or after updates):

```powershell
python -m pip install -r requirements.txt
```

## Configuration

Copy the example env file and set your connection string:

```powershell
Copy-Item .env.example .env
```

`DATABASE_URL` must use the Psycopg 3 SQLAlchemy dialect, for example:

```env
DATABASE_URL=postgresql+psycopg://learn2trade_user:development_password@localhost:5432/learn2trade
```

Never commit `.env`. Never hard-code credentials in Python source.

## Start FastAPI

```powershell
cd backend
.\.venv\Scripts\Activate.ps1
uvicorn app.main:app --reload
```

Optional CLI (requires `pip install "fastapi[standard]"`):

```powershell
fastapi dev app/main.py
```

## Test the database connection

With the API running:

- `GET /health` — process health
- `GET /health/database` — executes `SELECT 1` against PostgreSQL

Expected success body:

```json
{"status": "healthy", "database": "connected"}
```

If PostgreSQL is down, the endpoint returns HTTP 503 with a generic message (no connection string or password).

## Alembic migrations

Alembic reads `DATABASE_URL` from application settings (`app/core/config.py`), not from a duplicated URL in `alembic.ini`.

### Existing database (already has tables)

This project's PostgreSQL schema already exists. **Do not** run `alembic upgrade head` against it for the initial revision — that would try to create tables that are already present.

After generating or receiving the baseline migration that matches the current schema, mark the database as up to date:

```powershell
alembic stamp head
```

`stamp` only records the revision in `alembic_version`. It does not create, alter, or drop tables.

### Empty database only

Use upgrade only when the database has **no** application tables yet:

```powershell
alembic upgrade head
```

### Generate future migrations

After model changes:

```powershell
alembic revision --autogenerate -m "describe change"
```

Review the generated script carefully, then apply it:

```powershell
alembic upgrade head
```

### Initialize Alembic (already done in this repo)

The project already contains `alembic.ini` and `migrations/`. Recreating from scratch is not required. If you ever need a fresh setup in another project:

```powershell
alembic init migrations
```

Then point `env.py` at `Base.metadata` and import all models.

## Tests

```powershell
cd backend
.\.venv\Scripts\Activate.ps1
pytest
```

Database health endpoint tests mock the SQLAlchemy engine so they do not mutate the development database. Model tests only inspect SQLAlchemy metadata.

## Project layout

```text
backend/
├── app/
│   ├── main.py
│   ├── core/          # settings, password hashing
│   ├── db/            # engine, session, Base
│   ├── models/        # SQLAlchemy models
│   ├── schemas/       # Pydantic schemas
│   └── api/routes/    # HTTP routes
├── migrations/        # Alembic
├── tests/
├── alembic.ini
├── requirements.txt
├── .env.example
└── .env               # local only, gitignored
```
