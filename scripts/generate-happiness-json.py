import csv
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / "data" / "clean" / "country_years_clean.csv"
DESTINATION = ROOT / "src" / "data" / "happiness.json"

COLUMNS = (
    "year",
    "country",
    "country_key",
    "region",
    "rank_recalc",
    "score",
    "gdp",
    "gdp_valid",
    "social",
    "hle",
    "freedom",
    "generosity",
    "corruption",
)
INTEGER_COLUMNS = {"year", "rank_recalc"}
NUMBER_COLUMNS = {"score", "gdp", "gdp_valid", "social", "hle", "freedom", "generosity", "corruption"}
NULLABLE_NUMBER_COLUMNS = {
    "gdp",
    "gdp_valid",
    "social",
    "hle",
    "freedom",
    "generosity",
    "corruption",
}


def convert_row(row):
    converted = {}
    for column in COLUMNS:
        raw = row[column].strip()
        if column in INTEGER_COLUMNS:
            converted[column] = int(raw)
        elif column == "score":
            converted[column] = None if raw == "" else float(raw)
        elif column in NULLABLE_NUMBER_COLUMNS:
            converted[column] = None if raw == "" else float(raw)
        else:
            converted[column] = raw
    return converted


def main():
    records = []
    with SOURCE.open("r", encoding="utf-8-sig", newline="") as source_file:
        reader = csv.DictReader(source_file)
        missing = set(COLUMNS) - set(reader.fieldnames or ())
        if missing:
            raise ValueError(f"Missing columns: {', '.join(sorted(missing))}")
        records = [convert_row(row) for row in reader]

    DESTINATION.parent.mkdir(parents=True, exist_ok=True)
    DESTINATION.write_text(
        json.dumps(records, ensure_ascii=False, indent=2) + "\n",
        encoding="utf-8",
    )
    print(f"Wrote {len(records)} records to {DESTINATION.relative_to(ROOT)}")


if __name__ == "__main__":
    main()
