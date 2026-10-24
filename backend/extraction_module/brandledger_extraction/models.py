"""Plain dataclasses describing the module's JSON-compatible output."""
from __future__ import annotations
from dataclasses import dataclass, field, asdict
from typing import Any, Optional

from .config import SCHEMA_VERSION


@dataclass
class ProcessingError:
    code: str          # e.g. UNSUPPORTED_FORMAT, EMPTY_FILE, CORRUPT_FILE
    message: str
    page: Optional[int] = None


@dataclass
class VisualWarning:
    code: str                  # e.g. LOW_RESOLUTION, POSSIBLE_BLUR
    severity: str              # info | low | medium | high
    confidence: float          # 0..1 - how sure the check is (NOT policy certainty)
    message: str
    page: Optional[int] = None
    details: dict = field(default_factory=dict)


@dataclass
class PageResult:
    page: int                  # 1-based
    text: str
    method: str                # text_layer | ocr | plain_text | image_ocr | none
    ocr_confidence: Optional[float] = None
    char_count: int = 0


@dataclass
class ExtractionResult:
    file_name: str
    file_type: str = ""        # extension without dot
    content_type: str = ""     # MIME type
    size_bytes: int = 0
    success: bool = False
    extraction_method: str = "none"
    extracted_text: str = ""
    pages: list = field(default_factory=list)
    ocr: dict = field(default_factory=dict)
    entities: dict = field(default_factory=dict)
    visual_summary: dict = field(default_factory=dict)
    visual_warnings: list = field(default_factory=list)
    logo_matches: list = field(default_factory=list)
    warnings: list = field(default_factory=list)       # plain-string processing notes
    errors: list = field(default_factory=list)
    human_review_required: bool = True
    review_reasons: list = field(default_factory=list)
    processing_ms: int = 0
    schema_version: str = SCHEMA_VERSION

    def to_dict(self) -> dict[str, Any]:
        return asdict(self)
