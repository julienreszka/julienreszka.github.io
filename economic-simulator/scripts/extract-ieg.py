#!/usr/bin/env python3
"""
Extract IEG World Bank Project Performance Ratings from Excel to JSON cache.
Source: https://ieg.worldbankgroup.org/ieg-data-world-bank-project-ratings-and-lessons
Input:  scripts/cache/ieg-ratings.xlsx
Output: scripts/cache/ieg-ratings.json
"""

import openpyxl
import json
import sys
import os

XLSX_PATH = os.path.join(os.path.dirname(__file__), "cache", "ieg-ratings.xlsx")
OUT_PATH = os.path.join(os.path.dirname(__file__), "cache", "ieg-ratings.json")

# IEG 6-point rating scale (used by Adarov & Panizza 2024)
RATING_MAP = {
    "Highly Satisfactory": 6,
    "Satisfactory": 5,
    "Moderately Satisfactory": 4,
    "Moderately Unsatisfactory": 3,
    "Unsatisfactory": 2,
    "Highly Unsatisfactory": 1,
    # Aliases that appear in some rows
    "HS": 6, "S": 5, "MS": 4, "MU": 3, "U": 2, "HU": 1,
}

def to_rating(val):
    if val is None:
        return None
    v = str(val).strip()
    return RATING_MAP.get(v)

def to_int_year(val):
    if val is None:
        return None
    try:
        return int(val)
    except (ValueError, TypeError):
        return None

def volume_to_mn(val):
    """Convert volume bucket string to numeric midpoint in USD millions."""
    if val is None:
        return None
    v = str(val).strip()
    if "Less than 10" in v:
        return 5.0
    if ">=10" in v and "<25" in v:
        return 17.5
    if ">=25" in v and "<50" in v:
        return 37.5
    if ">=50" in v and "<100" in v:
        return 75.0
    if ">= 100" in v or ">=100" in v or ">100" in v or "100 million" in v:
        return 150.0
    return None

print(f"Loading {XLSX_PATH} ...", file=sys.stderr)
wb = openpyxl.load_workbook(XLSX_PATH, read_only=True, data_only=True)
ws = wb["Data"]

rows = []
skipped = 0
for i, row in enumerate(ws.iter_rows(min_row=2, values_only=True)):
    country = row[15]
    closing_fy = to_int_year(row[4])
    outcome = to_rating(row[7])
    q_entry = to_rating(row[9])
    q_supervision = to_rating(row[10])
    volume_mn = volume_to_mn(row[20])
    global_practice = row[12]
    agreement_type = row[18]

    # Skip rows missing essential fields
    if not country or outcome is None or closing_fy is None:
        skipped += 1
        continue

    # Only include projects closed 2000-2023 (match our WB data window)
    if closing_fy < 2000 or closing_fy > 2023:
        skipped += 1
        continue

    rows.append({
        "country": country,
        "closingFY": closing_fy,
        "outcome": outcome,
        "qEntry": q_entry,
        "qSupervision": q_supervision,
        "volumeMn": volume_mn,
        "practice": global_practice,
        "agreementType": agreement_type,
    })

print(f"Extracted {len(rows)} rows, skipped {skipped}", file=sys.stderr)

# Unique countries
countries = sorted(set(r["country"] for r in rows))
print(f"Unique countries: {len(countries)}", file=sys.stderr)
print("Sample countries:", countries[:10], file=sys.stderr)

os.makedirs(os.path.dirname(OUT_PATH), exist_ok=True)
with open(OUT_PATH, "w") as f:
    json.dump(rows, f)

print(f"Saved to {OUT_PATH}", file=sys.stderr)
print(json.dumps({"rows": len(rows), "countries": len(countries)}))
