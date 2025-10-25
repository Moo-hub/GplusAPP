"""Small utility to inspect the users table and print columns and a masked admin hash.
Run from repository root with the virtualenv active:
  . .\.venv\Scripts\Activate.ps1
  python backend\scripts\inspect_users.py
"""
import sqlite3
import json
import re
import sys

import argparse

DB_PATH = "backend/app.db"
ADMIN_EMAIL = "admin@gplusapp.com"

def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--db", "-d", help="Path to sqlite DB file to inspect (file or sqlite:///url)", default=None)
    args = parser.parse_args()
    db_path = args.db or DB_PATH
    # Support sqlite:///./path and file paths
    if db_path.startswith("sqlite:///"):
        db_file = db_path.replace("sqlite:///", "").replace("file:", "")
    else:
        db_file = db_path
    try:
        conn = sqlite3.connect(db_file)
        cur = conn.cursor()
        cur.execute("PRAGMA table_info('users')")
        cols = cur.fetchall()
        print("PRAGMA:", json.dumps(cols))
        candidates = [c[1] for c in cols if re.search(r"pass|hash", c[1], re.I)]
        if not candidates:
            print("No obvious password/hash column found")
            return 2
        col = candidates[0]
        cur.execute(f"SELECT id,email,{col} FROM users WHERE email=? LIMIT 1", (ADMIN_EMAIL,))
        row = cur.fetchone()
        if row:
            id_, email, ph = row
            ph_preview = (ph[:20] + "...") if ph and len(ph) > 20 else ph
            print(json.dumps({"column": col, "id": id_, "email": email, "hash_preview": ph_preview}))
            return 0
        else:
            print(f"No admin user row found for email {ADMIN_EMAIL}")
            return 3
    except Exception as e:
        print("ERROR", str(e))
        return 1
    finally:
        try:
            conn.close()
        except Exception:
            pass

if __name__ == '__main__':
    sys.exit(main())
