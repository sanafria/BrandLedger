"""BrandLedger - file extraction and visual checks (Mahadevi's module)."""
from .file_processing import extract_content
from .config import SCHEMA_VERSION

__all__ = ["extract_content", "SCHEMA_VERSION"]
