# Cards

A full-stack application with FastAPI backend and React frontend, using Supabase for authentication and database.

## Tech Stack

- **Backend**: FastAPI (Python 3.12)
- **Frontend**: React + TypeScript + Vite + Tailwind CSS
- **Auth/Database**: Supabase

## Project Structure

```
cards/
├── backend/
│   ├── app/
│   │   ├── main.py           # FastAPI entry point
│   │   ├── config.py         # Environment configuration
│   │   ├── dependencies.py   # Auth and Supabase dependencies
│   │   └── routers/
│   │       └── auth.py       # Authentication endpoints
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── api/              # API client
│   │   ├── components/       # React components
│   │   ├── hooks/            # Custom hooks (auth, etc.)
│   │   └── pages/            # Page components
│   ├── package.json
│   └── vite.config.ts
└── .env.example
```

## Setup

### Prerequisites

- Python 3.12+
- Node.js 18+
- A Supabase project

### 1. Clone and Configure

```bash
# Copy environment template
cp .env.example .env

# Edit .env with your Supabase credentials
```

### 2. Backend Setup

```bash
cd backend

# Create virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Run development server
uvicorn app.main:app --reload --port 8000
```

### 3. Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Run development server
npm run dev
```

## Development

During development, run both servers:

- **Backend**: http://localhost:8000
- **Frontend**: http://localhost:5173

The Vite dev server proxies `/api` requests to the FastAPI backend.

## API Endpoints

### Authentication

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/signup` | Create new account |
| POST | `/api/auth/login` | Sign in with email/password |
| POST | `/api/auth/logout` | Sign out (requires auth) |
| POST | `/api/auth/refresh` | Refresh access token |
| GET | `/api/auth/me` | Get current user (requires auth) |

### Health

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/health` | Health check |

## Production Build

```bash
# Build frontend
cd frontend
npm run build

# The FastAPI server will serve the built frontend from frontend/dist/
cd ../backend
uvicorn app.main:app --host 0.0.0.0 --port 8000
```

## Supabase Setup

1. Create a new project at [supabase.com](https://supabase.com)
2. Go to **Settings > API** to get your keys
3. Add the URL and keys to your `.env` file

### Optional: Disable Email Confirmation (Development)

For faster development, you can disable email confirmation:

1. Go to **Authentication > Providers > Email**
2. Disable "Confirm email"

## License

MIT
