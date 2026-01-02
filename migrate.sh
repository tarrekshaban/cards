#!/bin/bash

# Cards - Database Migration Runner
# Applies SQL migrations to Supabase database

set -e

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${GREEN}📦 Running Database Migrations${NC}"
echo ""

cd backend

# Activate virtual environment
if [ -d "venv" ]; then
    source venv/bin/activate
elif [ -d ".venv" ]; then
    source .venv/bin/activate
else
    echo "No virtual environment found. Run ./run.sh first to set up."
    exit 1
fi

# Run migrations
python migrate.py

echo ""
echo -e "${YELLOW}Note: Add DATABASE_URL to your .env for automatic migrations.${NC}"
echo "Get it from: Supabase Dashboard > Settings > Database > Connection string (URI)"
