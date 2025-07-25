import pandas as pd
import json
from pathlib import Path
from urllib.parse import quote_plus

# Load Excel file
xlsx = pd.ExcelFile('California_Arizona_Texas_Procurement_Data_Final.xlsx')

# Helper to trim column names and values
def trim_df(df):
    df = df.rename(columns=lambda c: c.strip())
    for col in df.columns:
        if df[col].dtype == object:
            df[col] = df[col].astype(str).str.strip()
    return df

# Parse procurement data
procurement = {}
for state_sheet, state_code in [
    ('California County Data ', 'CA'),
    ('Arizona County Data ', 'AZ'),
    ('Texas County Data', 'TX'),
]:
    df = trim_df(pd.read_excel(xlsx, sheet_name=state_sheet))
    # rename County column generically
    df = df.rename(columns={'County': 'County'})
    records = df.to_dict(orient='records')
    for rec in records:
        company = rec.get('Company Name', '')
        county = rec.get('County', '')
        # Normalize missing values to None
        for key in ('Notes', 'Contact', 'Google Maps'):
            if pd.isna(rec.get(key)):
                rec[key] = None
        if not rec.get('Contact') and company:
            rec['Contact'] = (
                'https://www.google.com/search?q=' +
                quote_plus(f'{company} contact information')
            )
        if not rec.get('Google Maps') and company and county:
            rec['Google Maps'] = (
                'https://www.google.com/maps/search/' +
                quote_plus(f'{company}, {county} County, {state_code}')
            )
    procurement[state_code] = records

# Parse county meta data
county_meta = {'CA': {}, 'AZ': {}, 'TX': {}}
for meta_sheet, state_code, county_col in [
    ('CA', 'CA', 'California County'),
    ('AZ', 'AZ', 'Arizona County'),
    ('TX', 'TX', 'Texas County'),
]:
    df = trim_df(pd.read_excel(xlsx, sheet_name=meta_sheet))
    for _, row in df.iterrows():
        county = row[county_col]
        if not county or pd.isna(county):
            continue
        def get_val(col):
            val = row.get(col)
            if pd.isna(val):
                return None
            return val
        def get_float(col):
            val = row.get(col)
            if pd.isna(val):
                return None
            return float(val)
        county_meta[state_code][county] = {
            'lat': get_float('Latitude'),
            'lon': get_float('Longitude'),
            'population': get_val('Population (2022)'),
            'area': get_val('Area (sq. km)'),
            'seat': get_val('County Seat'),
        }

# Parse SOLV BESS Sites
solv_sites = []
df = trim_df(pd.read_excel(xlsx, sheet_name='SOLV BESS Sites'))
for _, row in df.iterrows():
    solv_sites.append({
        'name': row['SOLV BESS PROJECT'],
        'capacity_ac': row['MW AC Capacity'],
        'capacity_dc': row['MW DC Capacity'],
        'client': row['Client'],
        'lat': float(row['Latitude']),
        'lon': float(row['Longitude']),
    })

data = {
    'procurement': procurement,
    'countyMeta': county_meta,
    'solvSites': solv_sites,
}

with open('frontend/data.json', 'w') as f:
    json.dump(data, f, indent=2, allow_nan=False)

print('Wrote frontend/data.json')
