#!/usr/bin/env python3
# -*- coding: utf-8 -*-

"""
GPlus Smart Builder Pro - Core Module (Part 1 of 2)
Version: 2.3.0 (Comprehensive Project Generation Logic)

This module contains the core functionalities for the GPlus Smart Builder Pro CLI.
It includes:
- Global configuration management with singleton pattern and robust loading.
- OS checks and environment setup.
- Robust logging system with localized messages.
- Internationalization (I18n) and localization (L10n) helpers.
- Pydantic models for defining project structure, components, and features.
- Comprehensive error handling and a decorator for command errors.
- Security utilities (hashing, token generation) using Cryptography library.
- Asynchronous task queue and resource limiting (if supported by OS).
- Advanced template management with recursive copy and conditional rendering.
- Helper functions for running commands and managing virtual environments.
"""

import sys
import os
import re
import json
import yaml
import shutil
import socket
import logging
import subprocess
import venv
import locale
import hashlib
import secrets
import threading
# For resource limits on Unix-like systems
if sys.platform != 'win32':
    import resource
from pathlib import Path
from typing import Any, Dict, List, Optional, Set, Union, Literal
from difflib import unified_diff
import typer
from jinja2 import (
    Environment,
    FileSystemLoader,
    Template,
    TemplateSyntaxError,
    exceptions as jinja2_exceptions,
)
from rich.console import Console
from rich.panel import Panel
from rich.table import Table
from rich.prompt import Confirm, Prompt
from rich.progress import (
    Progress,
    SpinnerColumn,
    TextColumn,
    BarColumn,
    TaskProgressColumn,
)
from datetime import datetime
from enum import Enum
from pydantic import BaseModel, Field, ValidationError, validator
from functools import wraps, lru_cache

# Import libraries for SecurityManager - handles potential ImportError gracefully
try:
    from cryptography.hazmat.primitives import hashes
    from cryptography.hazmat.primitives.asymmetric import padding
    from cryptography.hazmat.primitives.asymmetric import rsa
    from cryptography.hazmat.primitives import serialization
    from cryptography.hazmat.backends import default_backend
    from cryptography.fernet import Fernet
    _CRYPTO_AVAILABLE = True
except ImportError:
    _CRYPTO_AVAILABLE = False
    print("Cryptography library not found. Some security features will be disabled.", file=sys.stderr)


# --- Global Rich Console & Logging Setup ---
console = Console() # Initialize global console for rich output
ERROR_STYLE = "bold red"
WARNING_STYLE = "bold yellow"
INFO_STYLE = "bold blue"
DEBUG_STYLE = "bold gray"
SUCCESS_STYLE = "bold green"

# Configure logging
LOG_FORMAT = "%(asctime)s - %(name)s - %(levelname)s - %(message)s"
logging.basicConfig(level=logging.INFO, format=LOG_FORMAT)
logger = logging.getLogger("gplus_builder")

# --- App-wide Configuration (Singleton Pattern) ---

class Config:
    """
    Manages application-wide configuration using a singleton pattern.
    Loads settings from config.yaml and provides various paths and constants.
    """
    _instance = None
    _initialized = False
    BASE_DIR = Path(__file__).resolve().parent
    CONFIG_FILE_PATH = BASE_DIR / "config.yaml"

    DEFAULT_CONFIG = {
        "APP_NAME": "GPlus Smart Builder Pro",
        "APP_VERSION": "2.3.0",
        "AUTHOR": "GPlus",
        "LICENSE": "MIT",
        "WEBSITE": "https://www.gplus.com",
        "GITHUB_REPO": "https://github.com/gplus",
        "LOG_DIR_NAME": "logs",
        "CACHE_DIR_NAME": "cache",
        "LOCALE_DIR_NAME": "locales",
        "GENERATOR_TEMPLATES_DIR_NAME": "templates", # Root for all templates
        "DEFAULT_LANGUAGE": "en",
        "LOG_LEVEL": "INFO", # DEBUG, INFO, WARNING, ERROR, CRITICAL
        "SUPPORTED_LANGUAGES": ["en", "ar"],
        "RESOURCE_LIMITS": {
            "memory_mb": 512, # 512 MB
            "cpu_seconds": 60 # 60 seconds
        }
    }

    def __new__(cls, *args, **kwargs):
        if not cls._instance:
            cls._instance = super(Config, cls).__new__(cls)
        return cls._instance

    def __init__(self):
        if not self._initialized:
            self._load_config()
            self._setup_paths()
            self._setup_logging()
            self._initialized = True

    def _load_config(self):
        """Loads configuration from config.yaml or uses defaults."""
        self.config_data = self.DEFAULT_CONFIG.copy()
        if self.CONFIG_FILE_PATH.exists():
            try:
                with open(self.CONFIG_FILE_PATH, 'r', encoding='utf-8') as f:
                    user_config = yaml.safe_load(f)
                    if user_config:
                        self.config_data.update(user_config)
                logger.info(f"Configuration loaded from {self.CONFIG_FILE_PATH}")
            except Exception as e:
                logger.error(f"Error loading config.yaml: {e}. Using default configuration.", exc_info=True)
                console.print(f"[bold yellow]Warning:[/bold yellow] Error loading [cyan]config.yaml[/cyan]: [red]{e}[/red]. Using default configuration.", style=WARNING_STYLE)
        else:
            logger.info(f"config.yaml not found at {self.CONFIG_FILE_PATH}. Using default configuration.")
            console.print(f"[bold yellow]Warning:[/bold yellow] [cyan]config.yaml[/cyan] not found. Using default configuration.", style=WARNING_STYLE)

    def _setup_paths(self):
        """Sets up various application paths."""
        self.APP_NAME = self.config_data["APP_NAME"]
        self.APP_VERSION = self.config_data["APP_VERSION"]
        self.AUTHOR = self.config_data["AUTHOR"]
        self.LICENSE = self.config_data["LICENSE"]
        self.WEBSITE = self.config_data["WEBSITE"]
        self.GITHUB_REPO = self.config_data["GITHUB_REPO"]
        self.DEFAULT_LANGUAGE = self.config_data["DEFAULT_LANGUAGE"]
        self.SUPPORTED_LANGUAGES = set(self.config_data["SUPPORTED_LANGUAGES"])
        self.RESOURCE_LIMITS = self.config_data["RESOURCE_LIMITS"]

        self.LOG_DIR_PATH = self.BASE_DIR / self.config_data["LOG_DIR_NAME"]
        self.CACHE_DIR_PATH = self.BASE_DIR / self.config_data["CACHE_DIR_NAME"]
        self.LOCALE_DIR_PATH = self.BASE_DIR / self.config_data["LOCALE_DIR_NAME"]
        self.GENERATOR_TEMPLATES_DIR_PATH = self.BASE_DIR / self.config_data["GENERATOR_TEMPLATES_DIR_NAME"]

        self.LOG_DIR_PATH.mkdir(parents=True, exist_ok=True)
        self.CACHE_DIR_PATH.mkdir(parents=True, exist_ok=True)
        self.LOCALE_DIR_PATH.mkdir(parents=True, exist_ok=True)
        self.GENERATOR_TEMPLATES_DIR_PATH.mkdir(parents=True, exist_ok=True) # Ensure templates root exists

    def _setup_logging(self):
        """Sets up the logging level based on configuration."""
        log_level_str = self.config_data.get("LOG_LEVEL", "INFO").upper()
        log_level = getattr(logging, log_level_str, logging.INFO)
        logger.setLevel(log_level)
        for handler in logger.handlers[:]: # Remove existing handlers
            logger.removeHandler(handler)
        file_handler = logging.FileHandler(self.LOG_DIR_PATH / f"{self.APP_NAME.replace(' ', '_').lower()}.log")
        file_handler.setFormatter(logging.Formatter(LOG_FORMAT))
        logger.addHandler(file_handler)
        logger.info(f"Logging level set to {log_level_str}")

    def get_config_value(self, key: str, default: Any = None) -> Any:
        """Safely retrieves a configuration value."""
        return self.config_data.get(key, default)

# Global configuration instance (singleton)
app_config = Config()

# --- Custom Exception Classes ---

class AppError(Exception):
    """Base exception for application-specific errors."""
    def __init__(self, message: str, original_exception: Optional[Exception] = None):
        super().__init__(message)
        self.message = message
        self.original_exception = original_exception

class ConfigError(AppError):
    """Raised when there's an issue with configuration."""
    pass

class TemplateError(AppError):
    """Raised when there's an issue with template rendering or loading."""
    pass

class ValidationError(AppError):
    """Raised when input validation fails."""
    pass

class BuildError(AppError):
    """Raised when project build/generation fails."""
    pass

# --- Error Handling Decorator ---

def error_handler(f):
    """
    Decorator to gracefully handle exceptions in CLI commands.
    Logs the error and prints a user-friendly message.
    """
    @wraps(f)
    def wrapper(*args, **kwargs):
        initial_lang = detect_system_language() # Get initial language before command execution
        try:
            return f(*args, **kwargs)
        except AppError as e:
            log_error(f"Application Error: {e.message}", lang=initial_lang, error_obj=e.original_exception)
            console.print(f"[{ERROR_STYLE}]{get_localized_message('command_failed_error', initial_lang, command=f.__name__, error=e.message)}[/]", style=ERROR_STYLE)
            raise typer.Exit(1)
        except ValidationError as e:
            log_error(f"Validation Error: {e.message}", lang=initial_lang, error_obj=e.original_exception)
            console.print(f"[{ERROR_STYLE}]{get_localized_message('validation_failed_error', initial_lang, error=e.message)}[/]", style=ERROR_STYLE)
            raise typer.Exit(1)
        except Exception as e:
            # Catch all other unexpected exceptions
            log_critical(f"Unexpected Error in command '{f.__name__}': {e}", lang=initial_lang, error_obj=e)
            console.print(f"[{ERROR_STYLE}]{get_localized_message('unexpected_command_error', initial_lang, command=f.__name__, error=str(e))}[/]", style=ERROR_STYLE)
            raise typer.Exit(1)
    return wrapper

# --- OS & Environment Checks ---

def is_windows() -> bool:
    """Checks if the current OS is Windows."""
    return sys.platform.startswith('win')

def is_unix_like() -> bool:
    """Checks if the current OS is Unix-like (Linux, macOS, BSD)."""
    return not is_windows()

def get_os_info() -> Dict[str, str]:
    """Returns basic OS information."""
    return {
        "system": sys.platform,
        "name": os.name,
        "release": os.uname().release if is_unix_like() else "",
        "version": sys.version,
        "machine": os.uname().machine if is_unix_like() else ""
    }

def get_python_version() -> str:
    """Returns the current Python version string."""
    return sys.version.split(' ')[0]

# --- Logging Helpers ---

def set_debug_mode(enable: bool):
    """Enables or disables debug logging."""
    if enable:
        logger.setLevel(logging.DEBUG)
        log_debug(get_localized_message("debug_mode_enabled", detect_system_language()))
    else:
        logger.setLevel(logging.INFO)

def log_message(level: int, message: str, lang: str = None, error_obj: Optional[Exception] = None):
    """Helper to log messages with localization and Rich console output."""
    lang = lang or app_config.DEFAULT_LANGUAGE
    localized_message = get_localized_message(message, lang) if message in get_localized_messages(lang) else message

    if level == logging.DEBUG:
        logger.debug(localized_message, exc_info=error_obj is not None)
        console.print(f"[{DEBUG_STYLE}][DEBUG][/] {localized_message}")
    elif level == logging.INFO:
        logger.info(localized_message, exc_info=error_obj is not None)
        console.print(f"[{INFO_STYLE}][INFO][/] {localized_message}")
    elif level == logging.WARNING:
        logger.warning(localized_message, exc_info=error_obj is not None)
        console.print(f"[{WARNING_STYLE}][WARNING][/] {localized_message}")
    elif level == logging.ERROR:
        logger.error(localized_message, exc_info=error_obj is not None)
        console.print(f"[{ERROR_STYLE}][ERROR][/] {localized_message}")
    elif level == logging.CRITICAL:
        logger.critical(localized_message, exc_info=error_obj is not None)
        console.print(f"[{ERROR_STYLE}][CRITICAL][/] {localized_message}")

def log_debug(message: str, lang: str = None, error_obj: Optional[Exception] = None):
    log_message(logging.DEBUG, message, lang, error_obj)

def log_info(message: str, lang: str = None, error_obj: Optional[Exception] = None):
    log_message(logging.INFO, message, lang, error_obj)

def log_warning(message: str, lang: str = None, error_obj: Optional[Exception] = None):
    log_message(logging.WARNING, message, lang, error_obj)

def log_error(message: str, lang: str = None, error_obj: Optional[Exception] = None):
    log_message(logging.ERROR, message, lang, error_obj)

def log_critical(message: str, lang: str = None, error_obj: Optional[Exception] = None):
    log_message(logging.CRITICAL, message, lang, error_obj)

def log_success(message: str, lang: str = None):
    lang = lang or app_config.DEFAULT_LANGUAGE
    localized_message = get_localized_message(message, lang) if message in get_localized_messages(lang) else message
    logger.info(localized_message)
    console.print(f"[{SUCCESS_STYLE}][SUCCESS][/] {localized_message}")

# --- Internationalization (I18n) and Localization (L10n) ---

# A simple cache for loaded language files
_LOCALIZED_MESSAGES_CACHE: Dict[str, Dict[str, str]] = {}

# Default names for languages themselves, used when a localized string for the language name is not found
DEFAULT_LANGUAGE_NAMES = {
    "en": "English",
    "ar": "العربية"
}

def load_localized_messages(lang_code: str) -> Dict[str, str]:
    """Loads messages for a given language code, caching the result."""
    if lang_code in _LOCALIZED_MESSAGES_CACHE:
        return _LOCALIZED_MESSAGES_CACHE[lang_code]

    file_path = app_config.LOCALE_DIR_PATH / f"{lang_code}.yaml"
    if not file_path.exists():
        logger.warning(f"Locale file not found for language '{lang_code}' at {file_path}. Using default.")
        return {} # Return empty dict if file not found

    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            messages = yaml.safe_load(f)
            if not isinstance(messages, dict):
                raise ValueError("Locale file must contain a dictionary.")
            _LOCALIZED_MESSAGES_CACHE[lang_code] = messages
            return messages
    except Exception as e:
        logger.error(f"Error loading locale file for '{lang_code}': {e}", exc_info=True)
        return {}

def get_localized_messages(lang_code: str) -> Dict[str, str]:
    """Returns all localized messages for a given language."""
    return load_localized_messages(lang_code)

def get_localized_message(key: str, lang_code: str, default: Optional[str] = None, **kwargs) -> str:
    """
    Retrieves a localized message by key.
    Falls back to default language, then key itself if not found.
    Supports f-string style formatting via kwargs.
    """
    messages = get_localized_messages(lang_code)
    message = messages.get(key)

    if message is None:
        # Fallback to default language
        if lang_code != app_config.DEFAULT_LANGUAGE:
            default_messages = get_localized_messages(app_config.DEFAULT_LANGUAGE)
            message = default_messages.get(key)

    if message is None:
        # If still not found, use provided default or the key itself
        message = default if default is not None else key
        logger.warning(f"Missing localization key '{key}' for language '{lang_code}'. Using default/key: '{message}'")

    try:
        return message.format(**kwargs)
    except KeyError as e:
        logger.error(f"Missing format key in localized message for '{key}' ({lang_code}): {e}. Message: '{message}'")
        return message # Return raw message if formatting fails

def detect_system_language() -> str:
    """Detects the system's preferred language."""
    try:
        system_lang = locale.getlocale()[0] or os.getenv('LANG') or 'en_US'
        lang_code = system_lang.split('_')[0].lower()
        if lang_code in app_config.SUPPORTED_LANGUAGES:
            return lang_code
    except Exception as e:
        logger.warning(f"Could not detect system language: {e}. Falling back to default.")
    return app_config.DEFAULT_LANGUAGE

# --- Pydantic Models for Project Structure and Features ---

class FeatureFlag(BaseModel):
    name: str = Field(..., description="Unique identifier for the feature flag.")
    description: str = Field(..., description="A brief description of what the feature does.")
    default: bool = Field(False, description="Default state (on/off) of the feature.")

class ValueFeature(BaseModel):
    name: str = Field(..., description="Unique identifier for the value feature.")
    description: str = Field(..., description="A brief description of the value feature.")
    type: Literal["str", "int", "bool"] = Field(..., description="Expected data type of the value.")
    default: Union[str, int, bool] = Field(..., description="Default value.")
    prompt: Optional[str] = Field(None, description="Custom prompt message for user input.")

    @validator('default', pre=True)
    def validate_default_type(cls, v, values):
        expected_type = values.get('type')
        if expected_type == 'str' and not isinstance(v, str):
            raise ValueError(f"Default value '{v}' for '{values.get('name')}' must be a string.")
        elif expected_type == 'int' and not isinstance(v, int):
            raise ValueError(f"Default value '{v}' for '{values.get('name')}' must an integer.")
        elif expected_type == 'bool' and not isinstance(v, bool):
            raise ValueError(f"Default value '{v}' for '{values.get('name')}' must a boolean.")
        return v

class SourceConfig(BaseModel):
    source: str = Field(..., description="Relative path to the source file or directory within the template.")
    condition: Optional[str] = Field(None, description="Jinja2 expression for conditional inclusion.")
    rename: Optional[str] = Field(None, description="New name for the file/directory after copying. Supports Jinja2.")

class ComponentConfig(BaseModel):
    name: str = Field(..., description="Unique name of the component (e.g., 'BackendFastAPI', 'FrontendReact').")
    description: str = Field(..., description="A description of the component.")
    template_path: str = Field(..., description="Relative path to the component's template directory.")
    output_path: str = Field(..., description="Relative path in the target project. Supports Jinja2.")
    files: List[SourceConfig] = Field([], description="List of individual files to copy/render.")
    directories: List[SourceConfig] = Field([], description="List of directories to copy/render recursively.")
    optional_features: Dict[str, str] = Field({}, description="Dictionary of optional features for this component (key: feature name, value: description).")
    post_generation_commands: List[Dict[str, Any]] = Field([], description="List of commands to run after generation. Each item is a dict with 'command': List[str] and optional 'condition': str.")

class ProjectStructureConfig(BaseModel):
    project_type: str = Field(..., description="Overall type of the project (e.g., 'Web Application').")
    description: str = Field(..., description="General description of the project template.")
    global_feature_flags: Dict[str, FeatureFlag] = Field({}, description="Global boolean feature flags.")
    global_value_features: Dict[str, ValueFeature] = Field({}, description="Global value-based features.")
    components: List[ComponentConfig] = Field([], description="List of definable components for the project.")

# --- Security Manager (Singleton) ---

class SecurityManager:
    """
    Manages security-related operations like hashing and token generation.
    Implemented as a singleton.
    """
    _instance = None
    _initialized = False

    def __new__(cls, *args, **kwargs):
        if not cls._instance:
            cls._instance = super(SecurityManager, cls).__new__(cls)
        return cls._instance

    def __init__(self):
        if not self._initialized:
            self._initialized = True
            if not _CRYPTO_AVAILABLE:
                logger.warning("Cryptography library not available. SecurityManager will use simpler, less secure methods.")

    @lru_cache(maxsize=128)
    def hash_string(self, text: str, salt: Optional[str] = None) -> str:
        """Hashes a string using SHA256 with optional salt."""
        salt = salt or secrets.token_hex(16)
        salted_text = f"{salt}{text}".encode('utf-8')
        if _CRYPTO_AVAILABLE:
            digest = hashes.Hash(hashes.SHA256(), backend=default_backend())
            digest.update(salted_text)
            return f"sha256${salt}${digest.finalize().hex()}"
        else:
            # Fallback for systems without cryptography
            return f"sha256_fallback${salt}${hashlib.sha256(salted_text).hexdigest()}"

    def verify_hash(self, text: str, hashed_text: str) -> bool:
        """Verifies if a given string matches a hash."""
        parts = hashed_text.split('$')
        if len(parts) != 3 or (parts[0] not in ["sha256", "sha256_fallback"]):
            return False # Invalid hash format

        salt = parts[1]
        return self.hash_string(text, salt) == hashed_text

    def generate_token(self, length: int = 32, hex_format: bool = True) -> str:
        """Generates a secure random token."""
        if hex_format:
            return secrets.token_hex(length // 2)
        return secrets.token_urlsafe(length)

    def generate_fernet_key(self) -> str:
        """Generates a URL-safe base64-encoded key for Fernet encryption."""
        if _CRYPTO_AVAILABLE:
            return Fernet.generate_key().decode()
        else:
            logger.warning("Cryptography library not available. Cannot generate Fernet key.")
            return ""

    def encrypt_data(self, data: str, key: str) -> str:
        """Encrypts data using Fernet symmetric encryption."""
        if _CRYPTO_AVAILABLE:
            f = Fernet(key.encode())
            return f.encrypt(data.encode()).decode()
        else:
            logger.warning("Cryptography library not available. Cannot encrypt data.")
            return data # Return original data if encryption is not possible

    def decrypt_data(self, encrypted_data: str, key: str) -> str:
        """Decrypts data using Fernet symmetric encryption."""
        if _CRYPTO_AVAILABLE:
            f = Fernet(key.encode())
            return f.decrypt(encrypted_data.encode()).decode()
        else:
            logger.warning("Cryptography library not available. Cannot decrypt data.")
            return encrypted_data # Return original data if decryption is not possible

def get_security_manager() -> SecurityManager:
    """Returns the singleton SecurityManager instance."""
    return SecurityManager()

# --- Asynchronous Task Queue ---

class AppQueue:
    """
    A simple thread-safe queue for background tasks.
    Implemented as a singleton.
    """
    _instance = None
    _initialized = False

    def __new__(cls, *args, **kwargs):
        if not cls._instance:
            cls._instance = super(AppQueue, cls).__new__(cls)
        return cls._instance

    def __init__(self):
        if not self._initialized:
            self._queue = []
            self._lock = threading.Lock()
            self._initialized = True

    def add_task(self, task_func, *args, **kwargs):
        """Adds a task (function and its arguments) to the queue."""
        with self._lock:
            self._queue.append((task_func, args, kwargs))
            log_debug(f"Task added to queue: {task_func.__name__}")

    def run_next_task(self):
        """Runs the next task in the queue."""
        with self._lock:
            if not self._queue:
                log_debug("Queue is empty.")
                return False
            task_func, args, kwargs = self._queue.pop(0)
        try:
            log_debug(f"Running task: {task_func.__name__}")
            task_func(*args, **kwargs)
            log_debug(f"Task {task_func.__name__} completed.")
            return True
        except Exception as e:
            log_error(f"Error running queued task {task_func.__name__}: {e}", error_obj=e)
            return False

    def run_all_tasks(self, with_progress: bool = False, lang: str = None):
        """Runs all tasks currently in the queue, optionally with a progress bar."""
        if not self._queue:
            log_info(get_localized_message("no_tasks_to_run", lang or app_config.DEFAULT_LANGUAGE))
            return

        total_tasks = len(self._queue)
        log_info(f"Running {total_tasks} queued tasks...")

        if with_progress:
            with Progress(
                SpinnerColumn(),
                TextColumn("[progress.description]{task.description}"),
                BarColumn(),
                TaskProgressColumn(),
                TimeRemainingColumn(),
                TimeElapsedColumn(),
                console=console
            ) as progress:
                task = progress.add_task(get_localized_message("processing_tasks", lang or app_config.DEFAULT_LANGUAGE), total=total_tasks)
                while self._queue:
                    self.run_next_task()
                    progress.update(task, advance=1)
        else:
            while self._queue:
                self.run_next_task()

        log_info(get_localized_message("all_tasks_completed", lang or app_config.DEFAULT_LANGUAGE))

    def is_empty(self) -> bool:
        """Checks if the queue is empty."""
        with self._lock:
            return not bool(self._queue)

def get_app_queue() -> AppQueue:
    """Returns the singleton AppQueue instance."""
    return AppQueue()

# --- Resource Limiter ---

class ResourceLimiter:
    """
    Manages resource limits (memory, CPU time) for the application.
    Currently supports Unix-like systems for actual enforcement.
    Implemented as a singleton.
    """
    _instance = None
    _initialized = False

    def __new__(cls, *args, **kwargs):
        if not cls._instance:
            cls._instance = super(ResourceLimiter, cls).__new__(cls)
        return cls._instance

    def __init__(self):
        if not self._initialized:
            self.memory_limit_mb = app_config.RESOURCE_LIMITS.get("memory_mb")
            self.cpu_limit_seconds = app_config.RESOURCE_LIMITS.get("cpu_seconds")
            self._initialized = True

            if is_unix_like():
                try:
                    if self.memory_limit_mb:
                        # Convert MB to bytes for setrlimit
                        soft_limit_bytes = self.memory_limit_mb * 1024 * 1024
                        # Hard limit can be same as soft or RLIM_INFINITY
                        resource.setrlimit(resource.RLIMIT_AS, (soft_limit_bytes, resource.RLIM_INFINITY))
                        logger.info(f"Memory limit set to {self.memory_limit_mb} MB.")
                    if self.cpu_limit_seconds:
                        resource.setrlimit(resource.RLIMIT_CPU, (self.cpu_limit_seconds, self.cpu_limit_seconds))
                        logger.info(f"CPU time limit set to {self.cpu_limit_seconds} seconds.")
                except Exception as e:
                    logger.warning(f"Failed to set resource limits on this system: {e}")
                    console.print(f"[bold yellow]Warning:[/bold yellow] Failed to set resource limits: [red]{e}[/red]", style=WARNING_STYLE)
            else:
                logger.warning("Resource limits are not fully supported on this operating system.")

    def get_current_memory_usage(self) -> Optional[float]:
        """
        Returns current memory usage in MB for the current process.
        Returns None if not supported on the OS.
        """
        if is_unix_like():
            # For Unix-like, use resource.getrusage (resident set size)
            # rss is in bytes on macOS/Linux, convert to MB
            return resource.getrusage(resource.RUSAGE_SELF).ru_maxrss / 1024.0 # Convert KB to MB if needed
        elif is_windows():
            try:
                # For Windows, try psutil if available, otherwise N/A
                import psutil
                process = psutil.Process(os.getpid())
                return process.memory_info().rss / (1024 * 1024) # Bytes to MB
            except ImportError:
                logger.debug("psutil not installed, cannot get memory usage on Windows.")
                return None
            except Exception as e:
                logger.debug(f"Error getting memory usage on Windows: {e}")
                return None
        return None

    def check_limits(self):
        """Checks if current resource usage exceeds limits and raises an error if so."""
        current_memory = self.get_current_memory_usage()
        if self.memory_limit_mb and current_memory is not None and current_memory > self.memory_limit_mb:
            raise AppError(f"Memory limit of {self.memory_limit_mb} MB exceeded. Current: {current_memory:.2f} MB.")
        # CPU limit usually results in a signal (SIGXCPU) rather than Python exception

def get_resource_limiter() -> ResourceLimiter:
    """Returns the singleton ResourceLimiter instance."""
    return ResourceLimiter()

# --- Template Management ---

class TemplateManager:
    """
    Manages Jinja2 template loading, rendering, and file operations.
    Implemented as a singleton with a template cache.
    """
    _instance = None
    _initialized = False

    def __new__(cls, *args, **kwargs):
        if not cls._instance:
            cls._instance = super(TemplateManager, cls).__new__(cls)
        return cls._instance

    def __init__(self):
        if not self._initialized:
            self.templates_base_path = app_config.GENERATOR_TEMPLATES_DIR_PATH
            self.env = Environment(
                loader=FileSystemLoader(self.templates_base_path),
                trim_blocks=True,
                lstrip_blocks=True
            )
            # Add custom filters/globals to Jinja2 environment if needed
            self.env.globals['now'] = datetime.now
            self.env.globals['security_manager'] = get_security_manager()
            self.env.globals['app_config'] = app_config # Make app_config accessible in templates

            self._template_cache: Dict[str, Template] = {}
            self._initialized = True
            log_info(f"TemplateManager initialized with templates base path: {self.templates_base_path}")

    def get_template(self, template_name: str) -> Template:
        """
        Loads and caches a Jinja2 template.
        `template_name` is relative to GENERATOR_TEMPLATES_DIR_PATH.
        """
        if template_name in self._template_cache:
            return self._template_cache[template_name]
        try:
            template = self.env.get_template(template_name)
            self._template_cache[template_name] = template
            return template
        except jinja2_exceptions.TemplateNotFound:
            raise TemplateError(f"Template '{template_name}' not found.")
        except Exception as e:
            raise TemplateError(f"Error loading template '{template_name}': {e}", original_exception=e)

    def render_template(self, template_name: str, context: Dict[str, Any]) -> str:
        """Renders a template with the given context."""
        template = self.get_template(template_name)
        try:
            return template.render(context)
        except jinja2_exceptions.TemplateRuntimeError as e:
            # Catch errors during rendering (e.g., missing variable)
            raise TemplateError(f"Error rendering template '{template_name}': {e}", original_exception=e)
        except Exception as e:
            raise TemplateError(f"Unexpected error during rendering template '{template_name}': {e}", original_exception=e)

    def render_string(self, template_string: str, context: Dict[str, Any]) -> str:
        """Renders a string as a Jinja2 template with the given context."""
        try:
            template = self.env.from_string(template_string)
            return template.render(context)
        except jinja2_exceptions.TemplateSyntaxError as e:
            raise TemplateError(f"Syntax error in template string: {e.message} at line {e.lineno}", original_exception=e)
        except jinja2_exceptions.TemplateRuntimeError as e:
            raise TemplateError(f"Error rendering template string: {e}", original_exception=e)
        except Exception as e:
            raise TemplateError(f"Unexpected error rendering template string: {e}", original_exception=e)

    def copy_and_render_template_file(
        self,
        source_rel_path: Path,
        destination_path: Path,
        context: Dict[str, Any],
        lang: str
    ):
        """
        Copies a file from source_rel_path within the templates directory
        to destination_path, rendering if it's a Jinja2 template.
        """
        full_source_path = self.templates_base_path / source_rel_path
        if not full_source_path.exists():
            raise TemplateError(get_localized_message("template_file_not_found", lang, file_path=source_rel_path))

        destination_path.parent.mkdir(parents=True, exist_ok=True)

        if source_rel_path.suffix == ".jinja":
            # Render Jinja2 template
            output_filename = destination_path.stem # Remove .jinja
            final_destination_path = destination_path.parent / output_filename
            try:
                rendered_content = self.render_template(str(source_rel_path), context)
                final_destination_path.write_text(rendered_content, encoding='utf-8')
                log_debug(get_localized_message("rendered_file", lang, source=source_rel_path, dest=final_destination_path))
            except TemplateError as e:
                log_error(get_localized_message("template_render_failed", lang, file=source_rel_path, error=e.message), error_obj=e.original_exception)
                raise BuildError(get_localized_message("component_file_generation_failed", lang, file=source_rel_path))
        else:
            # Copy regular file
            shutil.copy2(full_source_path, destination_path)
            log_debug(get_localized_message("copied_file", lang, source=source_rel_path, dest=destination_path))

    def copy_and_render_template_directory(
        self,
        source_rel_dir: Path,
        destination_root_path: Path,
        context: Dict[str, Any],
        lang: str,
        template_output_path: Path # The actual output path for the component, used for calculating relative paths
    ):
        """
        Recursively copies a directory from source_rel_dir within the templates directory
        to destination_root_path, rendering .jinja files.
        """
        full_source_dir = self.templates_base_path / source_rel_dir
        if not full_source_dir.is_dir():
            raise TemplateError(get_localized_message("template_directory_not_found", lang, dir_path=source_rel_dir))

        log_info(get_localized_message("copying_dir_templates", lang, source=source_rel_dir, dest=destination_root_path))

        with Progress(
            SpinnerColumn(),
            TextColumn("[progress.description]{task.description}"),
            BarColumn(),
            TaskProgressColumn(),
            TimeRemainingColumn(),
            TimeElapsedColumn(),
            console=console,
            transient=True # Hide progress bar when done
        ) as progress:
            total_files = sum(1 for _ in full_source_dir.rglob('*') if _.is_file())
            task_id = progress.add_task(f"[cyan]{get_localized_message('processing_dir', lang, dir_name=source_rel_dir.name)}[/]", total=total_files)

            for src_file_path in full_source_dir.rglob('*'):
                if src_file_path.is_file():
                    # Calculate relative path from the *root of the template_path*
                    # Example: source_rel_dir = 'backend_fastapi/src', src_file_path = 'templates/backend_fastapi/src/main.py.jinja'
                    # rel_path_in_template_dir = 'src/main.py.jinja'
                    rel_path_in_template_dir = src_file_path.relative_to(full_source_dir)

                    # Determine the final destination path
                    # This path should be relative to the component's *actual* output directory
                    # Example: output_path = 'backend/my-project-api'
                    # final_destination_path = 'backend/my-project-api/src/main.py'
                    final_destination_file_path = template_output_path / rel_path_in_template_dir

                    if src_file_path.suffix == ".jinja":
                        # Remove .jinja from the final file name
                        final_destination_file_path = final_destination_file_path.parent / final_destination_file_path.stem

                    final_destination_file_path.parent.mkdir(parents=True, exist_ok=True)

                    if src_file_path.suffix == ".jinja":
                        try:
                            # Render the template using its path relative to self.templates_base_path
                            template_path_for_jinja = src_file_path.relative_to(self.templates_base_path)
                            rendered_content = self.render_template(str(template_path_for_jinja), context)
                            final_destination_file_path.write_text(rendered_content, encoding='utf-8')
                            log_debug(get_localized_message("rendered_file", lang, source=template_path_for_jinja, dest=final_destination_file_path))
                        except TemplateError as e:
                            log_error(get_localized_message("template_render_failed", lang, file=template_path_for_jinja, error=e.message), error_obj=e.original_exception)
                            progress.console.print(f"[bold red]{get_localized_message('template_render_failed', lang, file=template_path_for_jinja, error=e.message)}[/]")
                            raise BuildError(get_localized_message("component_dir_generation_failed", lang, dir=source_rel_dir))
                    else:
                        shutil.copy2(src_file_path, final_destination_file_path)
                        log_debug(get_localized_message("copied_file", lang, source=src_file_path, dest=final_destination_file_path))
                    progress.update(task_id, advance=1)
            progress.stop_task(task_id)
            progress.console.print(f"[green]{get_localized_message('dir_copy_complete', lang, dir_name=source_rel_dir.name)}[/green]")


def get_template_manager() -> TemplateManager:
    """Returns the singleton TemplateManager instance."""
    return TemplateManager()


# --- Command Execution Helpers ---

def run_command(
    command: List[str],
    cwd: Path,
    description: str,
    lang: str,
    error_message: str,
    check: bool = True,
    capture_output: bool = False,
    progress_task=None # Rich progress task
) -> Optional[Union[str, subprocess.CompletedProcess]]:
    """
    Runs a shell command with a progress spinner.
    Args:
        command: List of command and its arguments.
        cwd: Current working directory for the command.
        description: Description to show in the progress spinner.
        lang: Language for localized messages.
        error_message: Message to log and display on error.
        check: If True, raises subprocess.CalledProcessError on non-zero exit code.
        capture_output: If True, captures stdout/stderr. Returns CompletedProcess object.
        progress_task: A rich.progress.Task ID if using a shared progress bar.
    Returns:
        stdout string if capture_output is True and check is False, else None.
        If capture_output is True and check is True, returns subprocess.CompletedProcess.
    Raises:
        AppError on command failure if check is True.
    """
    log_info(f"Running command: {' '.join(command)} in {cwd}")
    localized_description = get_localized_message(description, lang)

    process = None
    output = ""

    try:
        if progress_task:
            # If a shared progress bar is provided, just update its description
            # The global console will handle the output directly unless captured.
            progress_task.description = localized_description
            if capture_output:
                # If capturing, still need to run without live progress for stdout/stderr
                # and then update a final status. This is a bit tricky with live rich progress.
                # For simplicity with capture_output, we won't use live progress bar directly.
                console.print(f"[bold blue]Executing:[/bold blue] {localized_description}...")
                result = subprocess.run(
                    command,
                    cwd=cwd,
                    check=check,
                    capture_output=True,
                    text=True,
                    encoding='utf-8'
                )
                output = result.stdout + result.stderr
                if result.returncode != 0 and check:
                    raise subprocess.CalledProcessError(result.returncode, command, output)
                return result
            else:
                # If not capturing, let subprocess output directly
                process = subprocess.Popen(command, cwd=cwd, stdout=subprocess.PIPE, stderr=subprocess.STDOUT, text=True, encoding='utf-8', bufsize=1)
                for line in process.stdout:
                    console.print(f"[dim]{line.strip()}[/dim]") # Print output as it comes
                process.wait()
                if process.returncode != 0 and check:
                    raise subprocess.CalledProcessError(process.returncode, command, f"Command failed with exit code {process.returncode}")
                return None # No direct output to return if not captured

        else:
            # Fallback to local progress spinner if no shared progress task
            with Progress(
                SpinnerColumn(),
                TextColumn("[progress.description]{task.description}"),
                console=console,
                transient=True
            ) as progress:
                task = progress.add_task(localized_description, total=None) # Total is None for spinner

                result = subprocess.run(
                    command,
                    cwd=cwd,
                    check=check,
                    capture_output=capture_output,
                    text=True,
                    encoding='utf-8'
                )
                if capture_output:
                    output = result.stdout + result.stderr
                log_info(f"Command completed: {' '.join(command)}")
                return result if capture_output else None

    except subprocess.CalledProcessError as e:
        log_error(f"{error_message}: {e.stderr or e.stdout}", lang=lang, error_obj=e)
        raise AppError(f"{get_localized_message(error_message, lang)}. {e.stderr or e.stdout}", original_exception=e)
    except FileNotFoundError:
        log_error(f"{error_message}: Command '{command[0]}' not found.", lang=lang)
        raise AppError(f"{get_localized_message(error_message, lang)}. Command '{command[0]}' not found. Is it installed and in your PATH?", original_exception=FileNotFoundError())
    except Exception as e:
        log_critical(f"Unexpected error running command '{' '.join(command)}': {e}", lang=lang, error_obj=e)
        raise AppError(f"{get_localized_message('command_unexpected_error', lang, command=' '.join(command), error=str(e))}", original_exception=e)


def create_venv_if_not_exists(venv_path: Path, lang: str):
    """Creates a Python virtual environment if it doesn't exist."""
    if not venv_path.exists():
        log_info(get_localized_message("creating_venv", lang, path=venv_path))
        try:
            venv.create(venv_path, with_pip=True, clear=False, symlinks=True)
            log_success(get_localized_message("venv_created_success", lang, path=venv_path))
        except Exception as e:
            log_error(get_localized_message("venv_creation_failed", lang, path=venv_path, error=str(e)), error_obj=e)
            raise BuildError(get_localized_message("venv_creation_failed", lang, path=venv_path, error=str(e)))
    else:
        log_info(get_localized_message("venv_already_exists", lang, path=venv_path))

def install_dependencies_in_venv(venv_path: Path, requirements_file: Path, lang: str):
    """Installs dependencies from a requirements file into a virtual environment."""
    if not requirements_file.exists():
        log_warning(get_localized_message("requirements_file_not_found", lang, file=requirements_file))
        return

    pip_path = venv_path / ("Scripts" if is_windows() else "bin") / "pip"
    if not pip_path.exists():
        raise BuildError(get_localized_message("pip_not_found_in_venv", lang, path=venv_path))

    log_info(get_localized_message("installing_dependencies", lang, file=requirements_file, venv=venv_path))
    try:
        run_command(
            [str(pip_path), "install", "-r", str(requirements_file)],
            cwd=venv_path.parent, # Run from the project root where requirements.txt might be
            description=get_localized_message("installing_deps_progress", lang, file=requirements_file.name),
            lang=lang,
            error_message="dependency_install_failed"
        )
        log_success(get_localized_message("dependencies_installed_success", lang, file=requirements_file, venv=venv_path))
    except AppError as e:
        raise BuildError(get_localized_message("dependency_install_failed", lang, file=requirements_file, error=e.message))

# --- Cleanup Helpers ---

def cleanup_temp_dirs(lang: str):
    """Removes temporary directories like cache and logs."""
    log_info(get_localized_message("cleaning_up_temp_dirs", lang))
    for path in [app_config.CACHE_DIR_PATH, app_config.LOG_DIR_PATH]:
        if path.exists():
            try:
                shutil.rmtree(path)
                log_success(get_localized_message("removed_directory", lang, path=path))
            except Exception as e:
                log_error(get_localized_message("failed_to_remove_directory", lang, path=path, error=str(e)), error_obj=e)
        else:
            log_info(get_localized_message("directory_not_found", lang, path=path))

def clear_cache_and_logs(lang: str):
    """Clears cache and logs directories."""
    cleanup_temp_dirs(lang)
    log_info(get_localized_message("cache_and_logs_cleared", lang))

# --- Project Type Detection (Placeholder for future use) ---
def detect_project_type(path: Path) -> str:
    """
    Attempts to detect the project type based on files in the given path.
    (This is a placeholder, will be expanded with more logic).
    """
    if (path / "package.json").exists() and (path / "src" / "App.js").exists():
        return "React"
    if (path / "main.py").exists() and (path / "requirements.txt").exists():
        with open(path / "requirements.txt", 'r') as f:
            if "fastapi" in f.read():
                return "FastAPI"
    if (path / "mkdocs.yml").exists():
        return "MkDocs"
    return "Unknown"

# --- Main application info/about helper (moved from app.py) ---
def display_app_info(lang: str):
    """Displays detailed information about the application and its environment."""
    console.print(Panel(get_localized_message("about_panel_title", lang), expand=False, style=INFO_STYLE))

    info_table = Table(show_header=False, show_lines=False, border_style="dim")
    info_table.add_column(get_localized_message("info_item_column", lang), style="bold cyan")
    info_table.add_column(get_localized_message("info_value_column", lang), style="green")

    info_table.add_row(get_localized_message("app_name_label", lang), app_config.APP_NAME)
    info_table.add_row(get_localized_message("version_label", lang), app_config.APP_VERSION)
    info_table.add_row(get_localized_message("author_label", lang), app_config.AUTHOR)
    info_table.add_row(get_localized_message("license_label", lang), app_config.LICENSE)
    info_table.add_row(get_localized_message("website_label", lang), app_config.WEBSITE)
    info_table.add_row(get_localized_message("github_label", lang), app_config.GITHUB_REPO)
    info_table.add_row(get_localized_message("python_version_label", lang), get_python_version())
    info_table.add_row(get_localized_message("os_label", lang), get_os_info()["system"])
    info_table.add_row(get_localized_message("current_locale_label", lang), locale.getlocale()[0] or "N/A")
    console.print(info_table)

    console.print(Panel(get_localized_message("config_info_title", lang), expand=False, style=INFO_STYLE))
    config_table = Table(show_header=False, show_lines=False, border_style="dim")
    config_table.add_column(get_localized_message("info_item_column", lang), style="bold cyan")
    config_table.add_column(get_localized_message("info_value_column", lang), style="green")

    config_table.add_row(get_localized_message("log_dir_label", lang), str(app_config.LOG_DIR_PATH))
    config_table.add_row(get_localized_message("cache_dir_label", lang), str(app_config.CACHE_DIR_PATH))
    config_table.add_row(get_localized_message("locale_dir_label", lang), str(app_config.LOCALE_DIR_PATH))
    config_table.add_row(get_localized_message("templates_dir_label", lang), str(app_config.GENERATOR_TEMPLATES_DIR_PATH))
    config_table.add_row(get_localized_message("default_lang_label", lang), app_config.DEFAULT_LANGUAGE)
    config_table.add_row(get_localized_message("log_level_label", lang), app_config.get_config_value("LOG_LEVEL"))
    console.print(config_table)

    console.print("\n" + get_localized_message("global_features_title", lang) + ":")
    template_manager = get_template_manager()
    try:
        project_structure = template_manager.get_template("project_template.yaml")
        # For about, we just load and parse, no rendering
        project_structure_data = yaml.safe_load(project_structure.render({})) # Render empty to get YAML data
        project_config = ProjectStructureConfig(**project_structure_data)

        if project_config.global_feature_flags:
            feature_flags_table = Table(show_header=True, show_lines=False, border_style="dim")
            feature_flags_table.add_column(get_localized_message("feature_name_column", lang), style="bold magenta")
            feature_flags_table.add_column(get_localized_message("description_column", lang), style="cyan")
            feature_flags_table.add_column(get_localized_message("default_column", lang), style="green")
            for flag_name, flag_obj in project_config.global_feature_flags.items():
                feature_flags_table.add_row(flag_obj.name, flag_obj.description, str(flag_obj.default))
            console.print(Panel(feature_flags_table, title=get_localized_message("global_feature_flags_title", lang), expand=False, style=INFO_STYLE))
        else:
            console.print("[grey]No global feature flags defined.[/grey]")

        if project_config.global_value_features:
            value_features_table = Table(show_header=True, show_lines=False, border_style="dim")
            value_features_table.add_column(get_localized_message("feature_name_column", lang), style="bold magenta")
            value_features_table.add_column(get_localized_message("description_column", lang), style="cyan")
            value_features_table.add_column(get_localized_message("type_column", lang), style="yellow")
            value_features_table.add_column(get_localized_message("default_column", lang), style="green")
            for value_name, value_obj in project_config.global_value_features.items():
                value_features_table.add_row(value_obj.name, value_obj.description, value_obj.type, str(value_obj.default))
            console.print(Panel(value_features_table, title=get_localized_message("global_value_features_title", lang), expand=False, style=INFO_STYLE))
        else:
            console.print("[grey]No global value features defined.[/grey]")

        console.print("\n" + get_localized_message("supported_components_title", lang) + ":")
        if project_config.components:
            components_table = Table(show_header=True, show_lines=False, border_style="dim")
            components_table.add_column(get_localized_message("component_name_column", lang), style="bold blue")
            components_table.add_column(get_localized_message("description_column", lang), style="cyan")
            components_table.add_column(get_localized_message("template_path_column", lang), style="magenta")
            for component_obj in project_config.components:
                components_table.add_row(component_obj.name, component_obj.description, component_obj.template_path)
            console.print(Panel(components_table, title=get_localized_message("available_components_title", lang), expand=False, style=INFO_STYLE))
        else:
            console.print("[grey]No components defined in project_template.yaml.[/grey]")

    except TemplateError as e:
        console.print(f"[bold red]{get_localized_message('template_loading_error', lang, error=e.message)}[/bold red]", style=ERROR_STYLE)
    except ValidationError as e:
        console.print(f"[bold red]{get_localized_message('template_validation_error', lang, error=e)}[/bold red]", style=ERROR_STYLE)
    except Exception as e:
        console.print(f"[bold red]{get_localized_message('unexpected_error_about', lang, error=str(e))}[/bold red]", style=ERROR_STYLE)

    console.print("\n" + get_localized_message("resource_limits_title", lang) + ":")
    limiter = get_resource_limiter()
    if is_unix_like() or (is_windows() and 'psutil' in sys.modules): # psutil check is for dynamic memory usage
        resource_table = Table(show_header=False, show_lines=False, border_style="dim")
        resource_table.add_column(get_localized_message("item_column", lang), style="bold cyan")
        resource_table.add_column(get_localized_message("limit_column", lang), style="magenta")
        resource_table.add_row(get_localized_message("memory_limit_label", lang), f"{app_config.RESOURCE_LIMITS.get('memory_mb', 'N/A')} MB")
        resource_table.add_row(get_localized_message("cpu_limit_label", lang), f"{app_config.RESOURCE_LIMITS.get('cpu_seconds', 'N/A')} {get_localized_message('seconds_unit', lang)}")
        current_memory = limiter.get_current_memory_usage()
        if current_memory is not None:
            resource_table.add_row(get_localized_message("current_memory_usage_label", lang), f"{current_memory:.2f} MB")
        console.print(resource_table)
    else:
        console.print(f"[yellow]{get_localized_message('resource_limits_unavailable', lang)}[/yellow]")


    console.print("\n" + get_localized_message("supported_languages_title", lang) + ":")
    if app_config.SUPPORTED_LANGUAGES:
        lang_table = Table(show_header=False, show_lines=False)
        lang_table.add_column(get_localized_message("code_column", lang), style="bold magenta")
        lang_table.add_column(get_localized_message("name_column", lang), style="cyan")
        for supported_lang_code in sorted(app_config.SUPPORTED_LANGUAGES):
            # Attempt to get the localized name of the language itself from the current locale
            localized_name = get_localized_message(supported_lang_code, lang, default=DEFAULT_LANGUAGE_NAMES.get(supported_lang_code, supported_lang_code.replace('_', ' ').title()))
            lang_table.add_row(supported_lang_code, localized_name)
        console.print(lang_table)
    else:
        console.print("[grey]No supported languages defined.[/grey]")
