import os

# Tests must be deterministic and offline: never call the live Gemini API,
# even when a developer's backend/.env contains a key. load_dotenv() does not
# override variables that are already set, so this takes precedence.
os.environ["GEMINI_API_KEY"] = ""
