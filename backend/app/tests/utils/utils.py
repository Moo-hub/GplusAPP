"""
Common small utilities for backend tests
"""
import random
import string


def random_lower_string(length: int = 12) -> str:
    """Return a random lowercase ASCII string of given length."""
    letters = string.ascii_lowercase
    return "".join(random.choice(letters) for _ in range(length))
