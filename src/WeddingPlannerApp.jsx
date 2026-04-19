"""One-off helper: split WeddingPlannerApp.jsx into src/wedding-planner modules."""
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
SRC = ROOT / "src"
SRC_APP = SRC / "WeddingPlannerApp.jsx"
OUT = SRC / "wedding-planner"

lines = SRC_APP.read_text(encoding="utf-8").splitlines(True)


def join_slice(start: int, end: int) -> str:
    """1-based inclusive start, 1-based inclusive end."""
    return "".join(lines[start - 1 : end])


OUT.mkdir(exist_ok=True)
(OUT / "utils").mkdir(exist_ok=True)
(OUT / "state").mkdir(exist_ok=True)
(OUT / "components").mkdir(exist_ok=True)
(OUT / "components" / "ui").mkdir(exist_ok=True)
(OUT / "components" / "tabs").mkdir(exist_ok=True)

# --- constants.js ---
constants = (
    '/** Set to true when deploying (e.g. Vercel) for localStorage persistence. */\n'
    "export const USE_LOCAL_STORAGE = false;\n"
    + join_slice(44, 44)  # STORAGE_KEY line only from original - line 44
    + "\n"
    + join_slice(51, 172)
    + join_slice(144, 172)  # DEFAULT_BUDGET_KEYS through PARTY_ROLES - WAIT duplicate

)
# Fix: line 44 is STORAGE_KEY - check
# Original 42-44:
# /** Set to true...
# export const USE_LOCAL_STORAGE = false;
# const STORAGE_KEY = ...

I'll read line 42-45 again - user file has USE_LOCAL_STORAGE at 43, STORAGE_KEY 44

constants = (
    join_slice(42, 44)  # comment + USE_LOCAL_STORAGE + STORAGE_KEY but USE is export in original
)

Actually original line 42-43:
```
/** Set to true when deploying (e.g. Vercel) for localStorage persistence. Artifact / demo: keep false. */
export const USE_LOCAL_STORAGE = false;
const STORAGE_KEY = 'aifora-wedding-planner-v1';
```

I'll use join_slice(42,44) + newline + join_slice(51,172) for THEMES through PARTY_ROLES

Then add export for STORAGE_KEY - change `const STORAGE_KEY` to `export const STORAGE_KEY`

I'll post-process in script.





Read