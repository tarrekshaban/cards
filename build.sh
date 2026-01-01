#!/usr/bin/env bash
# Build script for Render deployment

set -e

echo "=== Installing backend dependencies ==="
cd backend
pip install -r requirements.txt
cd ..

echo "=== Installing frontend dependencies ==="
cd frontend
npm install

echo "=== Building frontend ==="
npm run build
cd ..

echo "=== Build complete ==="
