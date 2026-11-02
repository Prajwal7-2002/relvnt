import io
import re
from typing import Optional, Tuple
import pandas as pd


class DefensiveCSVParser:
    """
    Robust, production-grade CSV parser for Meta Ads Manager, Instagram Insights,
    and YouTube Studio exports. Resilient against BOM headers, footer summaries,
    dirty currencies ($1,234.50, 1.4x), and unconventional date formats.
    """

    DATE_ALIASES = [
        "date",
        "day",
        "reporting starts",
        "reporting start",
        "time",
        "timestamp",
        "period",
        "reporting period",
    ]

    METRIC_ALIASES = {
        "roas": ["website purchase roas", "purchase roas", "roas", "return on ad spend"],
        "spend": ["amount spent", "spend", "cost", "total spent"],
        "reach": ["reach", "post reach", "accounts reached", "unique impressions"],
        "views": ["views", "video views", "3-second video plays", "impressions"],
    }

    @staticmethod
    def _clean_numeric_value(val) -> Optional[float]:
        if pd.isna(val):
            return None
        if isinstance(val, (int, float)):
            return float(val)

        # String cleaning
        s = str(val).strip()
        if not s or s in ["--", "NaN", "null", "N/A", "-"]:
            return None

        # Remove currency symbols, commas, trailing 'x', '%', spaces
        cleaned = re.sub(r"[^\d.-]", "", s)
        try:
            return float(cleaned)
        except ValueError:
            return None

    @classmethod
    def parse(
        cls,
        file_bytes: bytes,
        filename: str = "upload.csv",
        preferred_metric: Optional[str] = None,
    ) -> Tuple[pd.DataFrame, str, str]:
        """
        Parses raw bytes and returns (clean_dataframe, detected_date_col, detected_val_col).
        clean_dataframe columns: ['date', 'value']
        """
        # Try reading with common encodings and separators
        df = None
        for encoding in ["utf-8-sig", "utf-8", "latin1", "cp1252"]:
            for sep in [",", ";", "\t"]:
                try:
                    df = pd.read_csv(io.BytesIO(file_bytes), encoding=encoding, sep=sep)
                    if len(df.columns) > 1 and len(df) > 0:
                        break
                except Exception:
                    continue
            if df is not None and len(df.columns) > 1:
                break

        if df is None or df.empty:
            raise ValueError("Unable to read CSV file. Please verify it is a valid delimited text file.")

        # Strip whitespace from column names
        df.columns = [str(c).strip() for c in df.columns]

        # 1. Detect Date Column
        date_col = None
        for col in df.columns:
            normalized = col.lower().strip()
            if any(alias in normalized for alias in cls.DATE_ALIASES):
                date_col = col
                break
        if not date_col:
            date_col = df.columns[0]

        # 2. Detect Metric Column
        val_col = None
        col_normalized = {c: c.lower().strip() for c in df.columns}

        # If user explicitly preferred a metric (e.g. roas, reach)
        if preferred_metric and preferred_metric.lower() in cls.METRIC_ALIASES:
            aliases = cls.METRIC_ALIASES[preferred_metric.lower()]
            for orig, norm in col_normalized.items():
                if any(alias in norm for alias in aliases):
                    val_col = orig
                    break

        # Fallback metric search across all aliases
        if not val_col:
            for category, aliases in cls.METRIC_ALIASES.items():
                for orig, norm in col_normalized.items():
                    if any(alias in norm for alias in aliases):
                        val_col = orig
                        break
                if val_col:
                    break

        # Fallback: Find first column that has numeric content and is not the date column
        if not val_col:
            for orig in df.columns:
                if orig == date_col:
                    continue
                # sample values
                sample = df[orig].dropna().head(10)
                cleaned_sample = [cls._clean_numeric_value(x) for x in sample]
                if any(v is not None for v in cleaned_sample):
                    val_col = orig
                    break

        if not val_col:
            raise ValueError(
                f"Could not locate a numeric metric column in CSV. Found headers: {list(df.columns)}"
            )

        # 3. Filter out summary/total rows (e.g. "Total", "Grand Total", "Summary")
        def is_invalid_date_row(x):
            if pd.isna(x):
                return True
            s = str(x).lower().strip()
            return any(word in s for word in ["total", "summary", "average", "results", "all"])

        df = df[~df[date_col].apply(is_invalid_date_row)]

        # 4. Clean Dates & Values
        df["_parsed_date"] = pd.to_datetime(df[date_col], errors="coerce")
        df["_parsed_value"] = df[val_col].apply(cls._clean_numeric_value)

        # Drop invalid rows and sort chronologically
        clean_df = df.dropna(subset=["_parsed_date", "_parsed_value"]).copy()
        clean_df = clean_df.sort_values("_parsed_date").reset_index(drop=True)

        if len(clean_df) < 7:
            raise ValueError(
                f"CSV only contains {len(clean_df)} valid daily data rows. At least 7 consecutive days are required."
            )

        result_df = pd.DataFrame(
            {
                "date": clean_df["_parsed_date"].dt.strftime("%Y-%m-%d"),
                "value": clean_df["_parsed_value"].astype(float),
            }
        )

        # Deduplicate same dates by taking the latest or sum
        result_df = result_df.groupby("date", as_index=False)["value"].mean()

        return result_df, date_col, val_col

