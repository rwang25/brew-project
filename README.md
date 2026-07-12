# Brew Tracker

A local Streamlit app for tracking homebrew batches.

## Features

- Brew start, rack, bottle, and expected-ready dates
- Brew type, style, batch size, yeast, vessel, and fermentation temperature
- Ingredient lists with amounts, units, categories, and notes
- Gravity-reading history and chart
- Estimated ABV calculation using:
  `(original gravity - final gravity) * 131.25`
- Status tracking from planning through completion
- Process and tasting notes
- CSV export
- Persistent SQLite storage in `brews.db`

## Run locally

1. Install Python 3.10 or newer.
2. Open a terminal in this folder.
3. Create a virtual environment:

   macOS/Linux:
   ```bash
   python3 -m venv .venv
   source .venv/bin/activate
   ```

   Windows:
   ```powershell
   py -m venv .venv
   .venv\Scripts\activate
   ```

4. Install dependencies:

   ```bash
   pip install -r requirements.txt
   ```

5. Start the app:

   ```bash
   streamlit run app.py
   ```

The database is created automatically in the same folder as `app.py`.

## Backup

Copy `brews.db` somewhere safe. It contains all saved brew, ingredient, and gravity data.
