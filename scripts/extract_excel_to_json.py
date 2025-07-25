import pandas as pd
from pathlib import Path
from urllib.parse import quote_plus
import json

DATA_FILE = Path(__file__).resolve().parents[1] / 'California_Arizona_Texas_Procurement_Data_Final.xlsx'
OUTPUT_DIR = Path(__file__).resolve().parents[1] / 'data'

OUTPUT_DIR.mkdir(exist_ok=True)

excel = pd.ExcelFile(DATA_FILE)

# Sheets that contain county level procurement data and need contact/map links
COUNTY_SHEETS = {
    "California County Data": "CA",
    "Arizona County Data": "AZ",
    "Texas County Data": "TX",
}

for sheet in excel.sheet_names:
    df = excel.parse(sheet)
    df = df.dropna(how='all')
    df.columns = [str(c).strip() for c in df.columns]
    records = []
    for row in df.to_dict(orient='records'):
        cleaned = {}
        for k, v in row.items():
            key = str(k).strip()
            if isinstance(v, str):
                v = v.strip()
            if pd.isna(v):
                v = None
            cleaned[key] = v

        sheet_key = sheet.strip()
        if sheet_key in COUNTY_SHEETS:
            state = COUNTY_SHEETS[sheet_key]
            company = cleaned.get("Company Name")
            county = cleaned.get("County")
            if company and county:
                if cleaned.get("Contact") is None:
                    cleaned["Contact"] = (
                        "https://www.google.com/search?q="
                        + quote_plus(f"{company} contact information")
                    )
                if cleaned.get("Google Maps") is None:
                    cleaned["Google Maps"] = (
                        "https://www.google.com/maps/search/"
                        + quote_plus(f"{company}, {county} County, {state}")
                    )
        records.append(cleaned)
    file_name = sheet.strip().replace(' ', '_') + '.json'
    out_path = OUTPUT_DIR / file_name
    with open(out_path, 'w', encoding='utf-8') as f:
        json.dump(records, f, ensure_ascii=False, indent=2)
print('Exported', len(excel.sheet_names), 'sheets to', OUTPUT_DIR)
