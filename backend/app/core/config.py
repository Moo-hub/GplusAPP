from pydantic_settings import BaseSettings
import os
from typing import Optional

class Settings(BaseSettings):
    # Environment
    ENVIRONMENT: str = os.getenv("ENVIRONMENT", "development")
    
    # إعدادات API
    API_V1_STR: str = "/api/v1"
    PROJECT_NAME: str = "GPlus-Recycling-EcoSys-Pro"
    
    # إعدادات PostgreSQL
    POSTGRES_SERVER: str = os.getenv("POSTGRES_SERVER", "localhost")
    POSTGRES_PORT: int = int(os.getenv("POSTGRES_PORT", "5433"))
    POSTGRES_USER: str = os.getenv("POSTGRES_USER", "postgres")
    POSTGRES_PASSWORD: str = os.getenv("POSTGRES_PASSWORD", "postgres")
    POSTGRES_DB: str = os.getenv("POSTGRES_DB", "gplus_app")
    
    # إعدادات JWT
    SECRET_KEY: str = os.getenv("SECRET_KEY", "developmentkey123!@#")
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "60"))
    REFRESH_TOKEN_EXPIRE_DAYS: int = int(os.getenv("REFRESH_TOKEN_EXPIRE_DAYS", "7"))
    
    # إعدادات Redis
    REDIS_HOST: str = os.getenv("REDIS_HOST", "localhost")
    REDIS_PORT: int = int(os.getenv("REDIS_PORT", "6379"))
    
    # Redis Alerts إعدادات التنبيهات
    REDIS_ALERTS_ENABLED: bool = os.getenv("REDIS_ALERTS_ENABLED", "True").lower() in ("true", "1", "yes")
    REDIS_MONITORING_INTERVAL_MINUTES: int = int(os.getenv("REDIS_MONITORING_INTERVAL_MINUTES", "15"))
    REDIS_MEMORY_WARNING_PERCENT: float = float(os.getenv("REDIS_MEMORY_WARNING_PERCENT", "75.0"))
    REDIS_MEMORY_CRITICAL_PERCENT: float = float(os.getenv("REDIS_MEMORY_CRITICAL_PERCENT", "90.0"))
    
    # Email Notification إعدادات البريد الإلكتروني للتنبيهات
    REDIS_ALERT_RECIPIENTS: str = os.getenv("REDIS_ALERT_RECIPIENTS", "")  # Comma-separated email addresses
    
    # Slack Notification إعدادات Slack للتنبيهات
    SLACK_WEBHOOK_URL: str = os.getenv("SLACK_WEBHOOK_URL", "")
    SLACK_CHANNEL: str = os.getenv("SLACK_CHANNEL", "#alerts")
    
    # إعدادات الأمان
    CSRF_TOKEN_EXPIRE_MINUTES: int = int(os.getenv("CSRF_TOKEN_EXPIRE_MINUTES", "60"))
    RATE_LIMIT_MAX_REQUESTS: int = int(os.getenv("RATE_LIMIT_MAX_REQUESTS", "100"))
    RATE_LIMIT_WINDOW_SECONDS: int = int(os.getenv("RATE_LIMIT_WINDOW_SECONDS", "3600"))
    REQUIRE_EMAIL_VERIFICATION: bool = os.getenv("REQUIRE_EMAIL_VERIFICATION", "True").lower() in ("true", "1", "yes")
    DEBUG: bool = os.getenv("DEBUG", "True").lower() in ("true", "1", "yes")
    
    # إعدادات البريد الإلكتروني
    SMTP_HOST: str = os.getenv("SMTP_HOST", "smtp.gmail.com")
    SMTP_PORT: int = int(os.getenv("SMTP_PORT", "587"))
    SMTP_USER: str = os.getenv("SMTP_USER", "")
    SMTP_PASSWORD: str = os.getenv("SMTP_PASSWORD", "")
    SMTP_TLS: bool = os.getenv("SMTP_TLS", "True").lower() in ("true", "1", "yes")
    EMAILS_FROM_EMAIL: str = os.getenv("EMAILS_FROM_EMAIL", "noreply@gplusapp.com")
    EMAILS_FROM_NAME: str = os.getenv("EMAILS_FROM_NAME", "G+ App")
    
    # إعدادات واجهة المستخدم
    FRONTEND_URL: str = os.getenv("FRONTEND_URL", "http://localhost:3000")
    
    @property
    def DATABASE_URL(self) -> str:
        # Use SQLite for development, PostgreSQL for production
        if self.ENVIRONMENT == "development":
            # Use a local SQLite file for development (override with SQLITE_PATH if provided)
            sqlite_path = os.getenv("SQLITE_PATH", "./app.db")
            # Normalize to ensure three slashes path format
            if not (sqlite_path.startswith("./") or sqlite_path.startswith("/") or \
                    sqlite_path[1:3] == ":\\" or sqlite_path.startswith(".\\")):
                sqlite_path = f"./{sqlite_path}"
            return f"sqlite:///{sqlite_path}"
        if self.ENVIRONMENT == "test":
            # Dedicated test database file
            sqlite_path = os.getenv("TEST_SQLITE_PATH", "./test.db")
            if not (sqlite_path.startswith("./") or sqlite_path.startswith("/") or \
                    sqlite_path[1:3] == ":\\" or sqlite_path.startswith(".\\")):
                sqlite_path = f"./{sqlite_path}"
            return f"sqlite:///{sqlite_path}"
        return f"postgresql://{self.POSTGRES_USER}:{self.POSTGRES_PASSWORD}@{self.POSTGRES_SERVER}:{self.POSTGRES_PORT}/{self.POSTGRES_DB}"
        
    @property
    def REDIS_URL(self) -> str:
        return f"redis://{self.REDIS_HOST}:{self.REDIS_PORT}/0"

settings = Settings()