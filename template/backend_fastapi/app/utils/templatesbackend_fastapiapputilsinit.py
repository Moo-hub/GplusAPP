# templates/backend_fastapi/app/utils/__init__.py

from .json_encoder import safe_json_encoder, dumps, loads

__all__ = ['safe_json_encoder', 'dumps', 'loads']
