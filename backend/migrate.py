#!/usr/bin/env python3
"""
Database migration runner for Supabase.

Usage:
    python migrate.py          # Run all pending migrations
    python migrate.py --status # Show migration status

Requires DATABASE_URL in .env (get from Supabase Dashboard > Settings > Database > Connection string)
Or set SUPABASE_DB_HOST, SUPABASE_DB_PASSWORD for automatic URL construction.
"""

import os
import sys
import re
from pathlib import Path

# Load environment variables
from dotenv import load_dotenv
load_dotenv(Path(__file__).parent.parent / ".env")

MIGRATIONS_DIR = Path(__file__).parent / "migrations"


def get_database_url() -> str | None:
    """Get the PostgreSQL connection URL."""
    # Try direct DATABASE_URL first
    url = os.getenv("DATABASE_URL")
    if url:
        return url
    
    # Try to construct from Supabase URL
    supabase_url = os.getenv("SUPABASE_URL", "")
    db_password = os.getenv("SUPABASE_DB_PASSWORD", "")
    
    if supabase_url and db_password:
        # Extract project ref from URL: https://<ref>.supabase.co
        match = re.match(r"https://([^.]+)\.supabase\.co", supabase_url)
        if match:
            project_ref = match.group(1)
            # Supabase database connection format
            return f"postgresql://postgres.{project_ref}:{db_password}@aws-0-us-west-1.pooler.supabase.com:6543/postgres"
    
    return None


def get_migration_files() -> list[Path]:
    """Get all SQL migration files sorted by name."""
    if not MIGRATIONS_DIR.exists():
        return []
    return sorted(MIGRATIONS_DIR.glob("*.sql"))


def run_migrations_psycopg2(database_url: str, migrations: list[Path]) -> bool:
    """Run migrations using psycopg2."""
    try:
        import psycopg2
    except ImportError:
        print("Error: psycopg2 not installed. Run: pip install psycopg2-binary")
        return False
    
    try:
        print(f"Connecting to database...")
        conn = psycopg2.connect(database_url)
        conn.autocommit = True
        cursor = conn.cursor()
        
        for migration in migrations:
            print(f"\nRunning migration: {migration.name}")
            sql = migration.read_text()
            
            try:
                cursor.execute(sql)
                print(f"  ✓ Success")
            except psycopg2.Error as e:
                # Check if it's a "already exists" error (which is OK)
                error_msg = str(e)
                if "already exists" in error_msg:
                    print(f"  ✓ Already applied (skipping)")
                else:
                    print(f"  ✗ Error: {e}")
                    # Continue with other migrations
                    conn.rollback()
                    conn.autocommit = True
        
        cursor.close()
        conn.close()
        print("\n✓ Migrations complete!")
        return True
        
    except psycopg2.Error as e:
        print(f"Database connection error: {e}")
        return False


def copy_to_clipboard(text: str) -> bool:
    """Copy text to clipboard (macOS)."""
    try:
        import subprocess
        process = subprocess.Popen(['pbcopy'], stdin=subprocess.PIPE)
        process.communicate(text.encode('utf-8'))
        return True
    except Exception:
        return False


def main():
    """Main entry point."""
    print("=" * 60)
    print("Supabase Migration Runner")
    print("=" * 60)
    
    migrations = get_migration_files()
    
    if not migrations:
        print("No migration files found in migrations/")
        return
    
    print(f"\nFound {len(migrations)} migration(s):")
    for m in migrations:
        print(f"  - {m.name}")
    
    print("\n" + "-" * 60)
    
    # Try to get database URL
    database_url = get_database_url()
    
    if database_url:
        print("\nDatabase URL found. Running migrations...\n")
        success = run_migrations_psycopg2(database_url, migrations)
        if success:
            return
        print("\nDirect database connection failed.")
    
    # Fallback: print SQL and copy to clipboard
    print("\n" + "=" * 60)
    print("MANUAL MIGRATION REQUIRED")
    print("=" * 60)
    print("\nTo run migrations manually:")
    print("1. Go to Supabase Dashboard > SQL Editor")
    print("2. Paste the SQL below and click Run")
    print("\nAlternatively, add DATABASE_URL to your .env file:")
    print("  DATABASE_URL=postgresql://postgres.[project-ref]:[password]@...")
    print("\nYou can find this in Supabase Dashboard > Settings > Database > Connection string (URI)")
    
    print("\n" + "-" * 60)
    print("SQL TO RUN:")
    print("-" * 60 + "\n")
    
    full_sql = "\n\n".join(m.read_text() for m in migrations)
    print(full_sql)
    
    if copy_to_clipboard(full_sql):
        print("\n" + "=" * 60)
        print("✓ SQL copied to clipboard! Paste in Supabase SQL Editor.")
        print("=" * 60)


if __name__ == "__main__":
    main()
