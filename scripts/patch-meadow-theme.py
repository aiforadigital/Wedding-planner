"""One-off: replace meadow theme in minified bundles."""
from pathlib import Path

MEADOW_OLD = (
    'meadow:{labelKey:"themeMeadow",primary:"#8F8678",deep:"#5C6658",'
    'cream:"#F2F4EF",ivory:"#FAFBF8",dustyRose:"#C9AEA8",mutedRose:"#9E8A82",'
    'blush:"#E5E8E0",sage:"#9BAF96",burgundy:"#7A534F",banner:"#333D36"}'
)

MEADOW_NEW = (
    'meadow:{labelKey:"themeMeadow",primary:"#7BA3C4",deep:"#3D4A5A",'
    'cream:"#F0F6FA",ivory:"#FFFFFF",dustyRose:"#D0D8E0",mutedRose:"#A8B8C8",'
    'blush:"#FAFCFE",sage:"#B0C0D0",burgundy:"#5A6B7E",banner:"#2D3644"}'
)

# em dash U+2014; straight " as in minified JS
LABELS = [
    (
        'themeMeadow:"Meadow Moss \u2014 taupe & sage"',
        'themeMeadow:"Sky Silk \u2014 light blue, white & silver"',
    ),
    (
        'themeMeadow:"Meadow Moss \u2014 taupe & salie"',
        'themeMeadow:"Sky Silk \u2014 lichtblauw, wit & zilver"',
    ),
    (
        'themeMeadow:"Meadow Moss \u2014 taupe & sauge"',
        'themeMeadow:"Sky Silk \u2014 bleu clair, blanc & argent"',
    ),
]

ROOT = Path(__file__).resolve().parents[1]
PATHS = [
    ROOT / "dist" / "assets" / "index-BpGdWk42.js",
    ROOT / "demo" / "planner" / "assets" / "index-BpGdWk42.js",
]


def main() -> None:
    for path in PATHS:
        t = path.read_text(encoding="utf-8")
        if MEADOW_OLD not in t:
            raise SystemExit(f"meadow block not found: {path}")
        t = t.replace(MEADOW_OLD, MEADOW_NEW)
        for old, new in LABELS:
            t = t.replace(old, new)
        path.write_text(t, encoding="utf-8")
        print("patched", path.relative_to(ROOT))


if __name__ == "__main__":
    main()
