# Player Log Updater

Small static web app + API server to update `Duration (hh:mm)` and `Activity` for a selected player in the `Log` sheet of a Google spreadsheet.

## What it does

- Reads the `Log` sheet header rows and detects player groups dynamically.
- Finds each player's `Duration (hh:mm)` and `Activity` columns automatically.
- Lets a user select a player, date, duration, and activity.
- Updates the matching date row, or creates a new date row if missing.
- Leaves `R` and `Score` untouched (they stay formula-driven in your sheet).

## Activity options

- `-`
- `Bike`
- `Hike`
- `IndoorLow`
- `IndoorHigh`
- `Run`
- `Swim`
- `Tennis`
- `Walk`

## Setup

1. Create a Google Cloud service account and enable **Google Sheets API**.
2. Share the spreadsheet with the service account email (Editor access).
3. Copy `.env.example` to `.env` and set values.

Required `.env` values:

- `GOOGLE_SHEETS_SPREADSHEET_ID`
- `GOOGLE_SHEETS_CLIENT_EMAIL`
- `GOOGLE_SHEETS_PRIVATE_KEY`
- Optional: `GOOGLE_SHEETS_LOG_SHEET_NAME` (defaults to `Log`)
- Optional: `GOOGLE_SHEETS_DRY_RUN=true` to test writes safely without changing the sheet

## Safety behavior

- Before each write, the server validates that detected columns still match `Duration (hh:mm)`, `Activity`, and `Score` headers.
- If headers drift or mapping looks unsafe, the write is blocked.
- If `GOOGLE_SHEETS_DRY_RUN=true`, the API returns success preview data but writes nothing.

## Run

```bash
npm install
npm run dev
```

Open: `http://localhost:5173`

`npm run dev` starts both:

- API server on `http://localhost:3000`
- Vite UI on `http://localhost:5173` (with `/api` proxy to port 3000)

## Production-style run

```bash
npm run build
npm start
```

Then open `http://localhost:3000`.

## API endpoints

- `GET /api/health`
- `GET /api/players`
- `GET /api/dates?limit=90`
- `POST /api/entry`

`POST /api/entry` body:

```json
{
  "player": "Bryan",
  "date": "2026-02-24",
  "duration": "0:36",
  "activity": "Walk"
}
```
