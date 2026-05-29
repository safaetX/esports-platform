"""
Add profile columns to existing databases.
Run: python migrate_profile.py
"""
import sys
import os

sys.path.insert(0, os.path.dirname(__file__))

from sqlalchemy import text, inspect
from app.database import engine


def column_exists(inspector, table: str, column: str) -> bool:
    return column in {c["name"] for c in inspector.get_columns(table)}


def migrate():
    inspector = inspect(engine)
    alters = []

    user_cols = [
        ("full_name", "VARCHAR(128) NULL"),
        ("bio", "TEXT NULL"),
        ("country", "VARCHAR(64) NULL"),
        ("favorite_game", "VARCHAR(64) NULL"),
        ("is_active", "BOOLEAN NOT NULL DEFAULT TRUE"),
    ]
    if inspector.has_table("users"):
        for col, typedef in user_cols:
            if not column_exists(inspector, "users", col):
                alters.append(f"ALTER TABLE users ADD COLUMN {col} {typedef}")

    reg_cols = [
        ("registration_status", "VARCHAR(32) NOT NULL DEFAULT 'registered'"),
        ("placement", "VARCHAR(64) NULL"),
    ]
    if inspector.has_table("tournament_registrations"):
        for col, typedef in reg_cols:
            if not column_exists(inspector, "tournament_registrations", col):
                alters.append(f"ALTER TABLE tournament_registrations ADD COLUMN {col} {typedef}")

    if not alters:
        print("✅ Database already up to date.")
        return

    with engine.begin() as conn:
        for sql in alters:
            print(f"Running: {sql}")
            conn.execute(text(sql))
    print(f"✅ Applied {len(alters)} migration(s).")


if __name__ == "__main__":
    migrate()
