import os
from dotenv import load_dotenv
from pydantic_settings import BaseSettings
from pydantic import Field

load_dotenv()

class Settings(BaseSettings):
    APP_NAME: str = "GPlus Backend"
    APP_ENV: str = Field("development", env='APP_ENV')
    SECRET_KEY: str = Field("your-secret-key-here", env='SECRET_KEY')
    DATABASE_URL: str = Field("sqlite:///./gplus.db", env='DATABASE_URL')
    
    class Config:
        case_sensitive = True
        env_file = ".env"
        env_file_encoding = 'utf-8'

settings = Settings()
