from pathlib import Path
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse

from .config import get_settings
from .routers import auth, cards, admin

# Get settings
settings = get_settings()

# Create FastAPI app
app = FastAPI(
    title="Cards API",
    description="FastAPI backend with Supabase authentication",
    version="0.1.0",
    debug=settings.debug,
)

# Configure CORS for development
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",  # Vite dev server
        "http://127.0.0.1:5173",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(auth.router, prefix="/api/auth", tags=["auth"])
app.include_router(cards.router, prefix="/api", tags=["cards"])
app.include_router(admin.router, prefix="/api/admin", tags=["admin"])

# Path to frontend build directory
FRONTEND_BUILD_DIR = Path(__file__).parent.parent.parent / "frontend" / "dist"


# Mount static files if frontend build exists (production)
if FRONTEND_BUILD_DIR.exists():
    # Mount assets directory for JS, CSS, images
    assets_dir = FRONTEND_BUILD_DIR / "assets"
    if assets_dir.exists():
        app.mount("/assets", StaticFiles(directory=str(assets_dir)), name="assets")


@app.get("/api/health")
async def health_check():
    """Health check endpoint."""
    return {"status": "healthy"}


@app.get("/{full_path:path}")
async def serve_spa(request: Request, full_path: str):
    """
    Catch-all route to serve the React SPA.
    
    In production, serves the built React app.
    In development, this won't be hit as Vite handles routing.
    """
    # Skip API routes
    if full_path.startswith("api/"):
        return {"detail": "Not Found"}
    
    # Check if requesting a static file
    if FRONTEND_BUILD_DIR.exists():
        # Try to serve the requested file
        file_path = FRONTEND_BUILD_DIR / full_path
        if file_path.is_file():
            return FileResponse(file_path)
        
        # Otherwise serve index.html for client-side routing
        index_path = FRONTEND_BUILD_DIR / "index.html"
        if index_path.exists():
            return FileResponse(index_path)
    
    return {"detail": "Frontend not built. Run 'npm run build' in frontend directory."}
