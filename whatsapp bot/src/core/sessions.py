import sqlite3
import json
from datetime import datetime
from src.config import config

class SessionManager:
    def __init__(self, db_path: str = config.DB_PATH):
        self.db_path = db_path
        self._init_db()

    def _init_db(self):
        with sqlite3.connect(self.db_path) as conn:
            conn.execute("""
                CREATE TABLE IF NOT EXISTS sessions (
                    user_id TEXT PRIMARY KEY,
                    data TEXT,
                    last_updated TIMESTAMP
                )
            """)

    def get_session(self, user_id: str) -> dict:
        with sqlite3.connect(self.db_path) as conn:
            cursor = conn.execute("SELECT data FROM sessions WHERE user_id = ?", (user_id,))
            row = cursor.fetchone()
            if row:
                return json.loads(row[0])
            
            # Default session
            default_data = {
                "step": "welcome",
                "language": "en",
                "symptom": None
            }
            self.save_session(user_id, default_data)
            return default_data

    def save_session(self, user_id: str, data: dict):
        with sqlite3.connect(self.db_path) as conn:
            conn.execute("""
                INSERT OR REPLACE INTO sessions (user_id, data, last_updated)
                VALUES (?, ?, ?)
            """, (user_id, json.dumps(data), datetime.now()))

    def reset_session(self, user_id: str):
        default_data = {
            "step": "welcome",
            "language": "en",
            "symptom": None
        }
        self.save_session(user_id, default_data)
        return default_data

session_manager = SessionManager()
