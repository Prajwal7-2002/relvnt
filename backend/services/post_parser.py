import io
import re
from typing import Optional

import pandas as pd

from services.csv_parser import DefensiveCSVParser


class PostExportParser:
    """
    Parses per-post content exports (Meta Business Suite / Instagram Insights
    "Content" export) into one row per post. Column names vary between export
    versions and languages of the UI, so detection is alias-based.
    """

    # Ordered: earlier aliases win. "publish time" must beat the generic "date",
    # which in Meta exports is often a reporting-period label like "Lifetime".
    COLUMN_ALIASES = {
        "published": ["publish time", "published time", "post time", "posted", "created time", "date published", "timestamp", "date"],
        "post_type": ["post type", "media type", "content type", "type"],
        "reach": ["reach", "accounts reached", "post reach"],
        "views": ["views", "impressions", "plays", "video views"],
        "likes": ["likes", "reactions"],
        "comments": ["comments"],
        "shares": ["shares"],
        "saves": ["saves", "saved"],
        "permalink": ["permalink", "post link", "link", "url"],
        "caption": ["description", "caption", "title", "message"],
        "post_id": ["post id", "media id", "id"],
    }

    MAX_ROWS = 20000

    @classmethod
    def _read(cls, file_bytes: bytes) -> Optional[pd.DataFrame]:
        for encoding in ["utf-8-sig", "utf-8", "latin1"]:
            for sep in [",", ";", "\t"]:
                for skip in [0, 1, 2]:
                    try:
                        df = pd.read_csv(io.BytesIO(file_bytes), encoding=encoding, sep=sep, skiprows=skip)
                    except Exception:
                        continue
                    if len(df.columns) >= 3 and cls._find(df.columns, "published"):
                        return df
        return None

    @classmethod
    def _find(cls, columns, field: str) -> Optional[str]:
        normalized = {c: re.sub(r"\s+", " ", str(c).lower().strip()) for c in columns}
        for alias in cls.COLUMN_ALIASES[field]:
            for orig, norm in normalized.items():
                if norm == alias:
                    return orig
        for alias in cls.COLUMN_ALIASES[field]:
            for orig, norm in normalized.items():
                if alias in norm and len(alias) > 3:
                    return orig
        return None

    @classmethod
    def looks_like_post_export(cls, file_bytes: bytes) -> bool:
        """True when the file has one row per post (a post type, link or post id column)."""
        df = cls._read(file_bytes)
        if df is None:
            return False
        has_post_marker = any(cls._find(df.columns, f) for f in ("post_type", "permalink", "post_id"))
        has_metric = cls._find(df.columns, "reach") is not None or cls._find(df.columns, "views") is not None
        return has_post_marker and has_metric

    @staticmethod
    def normalize_post_type(value) -> str:
        s = str(value or "").lower()
        if "reel" in s:
            return "Reel"
        if "carousel" in s or "album" in s:
            return "Carousel"
        if "story" in s:
            return "Story"
        if "video" in s:
            return "Video"
        if "image" in s or "photo" in s or "picture" in s:
            return "Photo"
        return "Other"

    @classmethod
    def parse(cls, file_bytes: bytes) -> pd.DataFrame:
        df = cls._read(file_bytes)
        if df is None or df.empty:
            raise ValueError("Could not read the post export. Please upload the CSV from Business Suite > Insights > Content > Export.")
        if len(df) > cls.MAX_ROWS:
            raise ValueError(f"The export has more than {cls.MAX_ROWS:,} posts. Please export a shorter date range.")

        cols = {field: cls._find(df.columns, field) for field in cls.COLUMN_ALIASES}
        metric_col = cols["reach"] or cols["views"]
        if not metric_col:
            raise ValueError("The export has no Reach or Views column.")

        out = pd.DataFrame()
        out["published"] = pd.to_datetime(df[cols["published"]], errors="coerce")
        out["post_type"] = df[cols["post_type"]].map(cls.normalize_post_type) if cols["post_type"] else "Other"
        out["reach"] = df[metric_col].map(DefensiveCSVParser._clean_numeric_value)
        for field in ("views", "likes", "comments", "shares", "saves"):
            out[field] = df[cols[field]].map(DefensiveCSVParser._clean_numeric_value) if cols[field] else None
        for field in ("permalink", "caption"):
            out[field] = df[cols[field]].fillna("").astype(str) if cols[field] else ""

        out = out.dropna(subset=["published", "reach"])
        out = out[out["post_type"] != "Story"]  # stories expire and aren't comparable with feed posts
        out = out.sort_values("published").reset_index(drop=True)

        if len(out) < 6:
            raise ValueError(f"Only {len(out)} posts with a date and reach were found. At least 6 posts are needed.")

        out.attrs["metric"] = "reach" if cols["reach"] else "views"
        account_col = next((c for c in df.columns if str(c).lower().strip() in ("account username", "username", "account name")), None)
        if account_col and df[account_col].notna().any():
            handle = str(df[account_col].dropna().iloc[0]).strip()
            out.attrs["account"] = handle if handle.startswith("@") or " " in handle else f"@{handle}"
        return out
