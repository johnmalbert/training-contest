const { google } = require("googleapis");

const ACTIVITY_OPTIONS = ["-", "Bike", "Hike", "IndoorLow", "IndoorHigh", "Run", "Swim", "Tennis", "Walk"];
const MAX_SUGGESTION_ROW_CHECKS = 45;

function normalize(value) {
  return String(value ?? "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ");
}

function fillForward(row, length) {
  const result = [];
  let current = "";

  for (let i = 0; i < length; i += 1) {
    const cell = String(row?.[i] ?? "").trim();
    if (cell) {
      current = cell;
    }
    result.push(current);
  }

  return result;
}

function columnIndexToLetter(index) {
  let n = index + 1;
  let str = "";

  while (n > 0) {
    const mod = (n - 1) % 26;
    str = String.fromCharCode(65 + mod) + str;
    n = Math.floor((n - mod) / 26);
  }

  return str;
}

function parseSheetHeaders(rows) {
  const maxColumns = Math.max(...rows.map((r) => r.length), 0);

  if (maxColumns === 0) {
    throw new Error("No data found in Log sheet.");
  }

  const subheaderKeywords = ["duration (hh:mm)", "activity", "r", "score"];
  let bestMatch = null;

  for (let playerRow = 0; playerRow <= Math.min(4, rows.length - 1); playerRow += 1) {
    for (
      let subheaderRow = playerRow + 1;
      subheaderRow <= Math.min(playerRow + 3, rows.length - 1);
      subheaderRow += 1
    ) {
      const playerCells = fillForward(rows[playerRow], maxColumns);
      const subheaderCells = rows[subheaderRow] ?? [];
      let score = 0;

      for (let c = 0; c < maxColumns; c += 1) {
        const player = playerCells[c];
        const subheader = normalize(subheaderCells[c]);

        if (player && subheaderKeywords.includes(subheader)) {
          score += 1;
        }
      }

      if (!bestMatch || score > bestMatch.score) {
        bestMatch = { playerRow, subheaderRow, score };
      }
    }
  }

  if (!bestMatch || bestMatch.score < 4) {
    throw new Error("Could not detect player header and subheader rows in the Log sheet.");
  }

  const { playerRow, subheaderRow } = bestMatch;
  const playerCells = fillForward(rows[playerRow], maxColumns);
  const subheaderCells = rows[subheaderRow] ?? [];
  const players = new Map();

  for (let c = 0; c < maxColumns; c += 1) {
    const playerName = String(playerCells[c] ?? "").trim();
    const subheader = normalize(subheaderCells[c]);

    if (!playerName) {
      continue;
    }

    if (!players.has(playerName)) {
      players.set(playerName, {
        player: playerName,
        columns: {},
        subheaderRow: subheaderRow + 1,
        firstDataRow: subheaderRow + 2
      });
    }

    const playerInfo = players.get(playerName);

    if (subheader === "duration (hh:mm)") {
      playerInfo.columns.duration = c;
    } else if (subheader === "activity") {
      playerInfo.columns.activity = c;
    } else if (subheader === "r") {
      playerInfo.columns.r = c;
    } else if (subheader === "score") {
      playerInfo.columns.score = c;
    }
  }

  const parsedPlayers = [...players.values()].filter(
    (p) => p.columns.duration !== undefined && p.columns.activity !== undefined
  );

  if (!parsedPlayers.length) {
    throw new Error("No players with both Duration (hh:mm) and Activity columns were found.");
  }

  return {
    players: parsedPlayers.sort((a, b) => a.player.localeCompare(b.player)),
    playerHeaderRow: playerRow + 1,
    subheaderRow: subheaderRow + 1,
    firstDataRow: subheaderRow + 2
  };
}

function normalizeDateInput(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    throw new Error("Invalid date. Use YYYY-MM-DD.");
  }
  return date.toISOString().slice(0, 10);
}

function parseSheetDateToIso(value) {
  if (!value) {
    return null;
  }

  if (typeof value === "number") {
    const unixDays = Math.floor(value - 25569);
    const ms = unixDays * 86400 * 1000;
    const d = new Date(ms);
    if (Number.isNaN(d.getTime())) {
      return null;
    }
    return d.toISOString().slice(0, 10);
  }

  const text = String(value).trim();
  if (!text) {
    return null;
  }

  const d = new Date(text);
  if (Number.isNaN(d.getTime())) {
    return null;
  }

  return d.toISOString().slice(0, 10);
}

function parseMonthDayToIso(value) {
  const text = String(value ?? "").trim();
  if (!text) {
    return null;
  }

  const currentYear = new Date().getFullYear();
  const withCurrentYear = new Date(`${text} ${currentYear}`);
  if (!Number.isNaN(withCurrentYear.getTime())) {
    return withCurrentYear.toISOString().slice(0, 10);
  }

  const withPreviousYear = new Date(`${text} ${currentYear - 1}`);
  if (!Number.isNaN(withPreviousYear.getTime())) {
    return withPreviousYear.toISOString().slice(0, 10);
  }

  return null;
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function buildDateOccupiedError(message, suggestion = null) {
  const error = new Error(message);
  error.code = "DATE_ALREADY_POPULATED";
  error.suggestion = suggestion;
  return error;
}

class SheetsService {
  constructor() {
    const privateKeyRaw = process.env.GOOGLE_SHEETS_PRIVATE_KEY;

    if (!process.env.GOOGLE_SHEETS_SPREADSHEET_ID || !process.env.GOOGLE_SHEETS_CLIENT_EMAIL || !privateKeyRaw) {
      throw new Error("Missing required Google Sheets environment variables.");
    }

    this.spreadsheetId = process.env.GOOGLE_SHEETS_SPREADSHEET_ID;
    this.sheetName = process.env.GOOGLE_SHEETS_LOG_SHEET_NAME || "Log";
    this.activityOptions = ACTIVITY_OPTIONS;
    this.dryRun = String(process.env.GOOGLE_SHEETS_DRY_RUN || "false").toLowerCase() === "true";

    const auth = new google.auth.JWT({
      email: process.env.GOOGLE_SHEETS_CLIENT_EMAIL,
      key: privateKeyRaw.replace(/\\n/g, "\n"),
      scopes: ["https://www.googleapis.com/auth/spreadsheets"]
    });

    this.sheets = google.sheets({ version: "v4", auth });
    this.cachedHeaderInfo = null;
    this.cachedAt = 0;
    this.cacheMs = 30000;
  }

  async getHeaderInfo(forceRefresh = false) {
    const now = Date.now();
    if (!forceRefresh && this.cachedHeaderInfo && now - this.cachedAt < this.cacheMs) {
      return this.cachedHeaderInfo;
    }

    const response = await this.sheets.spreadsheets.values.get({
      spreadsheetId: this.spreadsheetId,
      range: `${this.sheetName}!A1:ZZ10`
    });

    const parsed = parseSheetHeaders(response.data.values ?? []);
    this.cachedHeaderInfo = parsed;
    this.cachedAt = now;
    return parsed;
  }

  async getPlayers() {
    const headerInfo = await this.getHeaderInfo();

    return {
      activityOptions: this.activityOptions,
      firstDataRow: headerInfo.firstDataRow,
      players: headerInfo.players.map((p) => ({
        player: p.player,
        fields: {
          durationColumn: columnIndexToLetter(p.columns.duration),
          activityColumn: columnIndexToLetter(p.columns.activity)
        }
      }))
    };
  }

  async getDateRows(limit = 365) {
    const headerInfo = await this.getHeaderInfo();
    const start = headerInfo.firstDataRow;
    const end = start + Math.max(120, limit * 2);

    const response = await this.sheets.spreadsheets.values.get({
      spreadsheetId: this.spreadsheetId,
      range: `${this.sheetName}!A${start}:B${end}`,
      valueRenderOption: "UNFORMATTED_VALUE"
    });

    const rows = response.data.values ?? [];
    const mapped = [];

    for (let i = 0; i < rows.length; i += 1) {
      const row = rows[i] ?? [];
      const fromA = parseSheetDateToIso(row[0]);
      const fromB = parseSheetDateToIso(row[1]) || parseMonthDayToIso(row[1]);
      const isoDate = fromA || fromB;

      if (!isoDate) {
        continue;
      }

      mapped.push({ row: start + i, date: isoDate });
    }

    return mapped;
  }

  async getRecentDates(limit = 60) {
    const rows = await this.getDateRows(limit * 2);
    const dates = rows.map((item) => item.date).filter(Boolean).slice(-limit).reverse();
    return [...new Set(dates)];
  }

  async getCellValue(range, valueRenderOption = "UNFORMATTED_VALUE") {
    const response = await this.sheets.spreadsheets.values.get({
      spreadsheetId: this.spreadsheetId,
      range,
      valueRenderOption
    });

    return response.data.values?.[0]?.[0];
  }

  async getScoreState(scoreColumn, row) {
    const range = `${this.sheetName}!${scoreColumn}${row}`;
    const [rawScore, formulaText] = await Promise.all([
      this.getCellValue(range, "UNFORMATTED_VALUE"),
      this.getCellValue(range, "FORMULA")
    ]);

    return {
      rawScore,
      formulaText: String(formulaText ?? "").trim()
    };
  }

  async restoreScoreFormula(scoreColumn, row, formulaText) {
    await this.sheets.spreadsheets.values.update({
      spreadsheetId: this.spreadsheetId,
      range: `${this.sheetName}!${scoreColumn}${row}`,
      valueInputOption: "USER_ENTERED",
      requestBody: { values: [[formulaText]] }
    });
  }

  async getScoreValue(scoreColumn, row, existingFormulaText = "", attempts = 20, delayMs = 500) {
    let lastRawScore = null;

    for (let attempt = 1; attempt <= attempts; attempt += 1) {
      const state = await this.getScoreState(scoreColumn, row);
      const raw = state.rawScore;
      const normalized = String(raw ?? "").trim();
      lastRawScore = raw ?? lastRawScore;

      const hadFormula = existingFormulaText.startsWith("=");
      const hasFormulaNow = state.formulaText.startsWith("=");

      if (hadFormula && !hasFormulaNow) {
        await this.restoreScoreFormula(scoreColumn, row, existingFormulaText);
        if (attempt < attempts) await sleep(delayMs);
        continue;
      }

      if (normalized) {
        const isZero = Number(raw) === 0;
        if (!isZero || attempt === attempts) {
          return raw;
        }
        if (attempt < attempts) await sleep(delayMs);
        continue;
      }

      if (attempt < attempts) await sleep(delayMs);
    }

    return lastRawScore;
  }

  async assertColumnMappingIsSafe(playerInfo, headerInfo) {
    const neededColumns = [playerInfo.columns.duration, playerInfo.columns.activity, playerInfo.columns.score].filter(
      (value) => value !== undefined
    );

    const maxColumn = Math.max(...neededColumns);
    const endLetter = columnIndexToLetter(maxColumn);

    const response = await this.sheets.spreadsheets.values.get({
      spreadsheetId: this.spreadsheetId,
      range: `${this.sheetName}!A${headerInfo.subheaderRow}:${endLetter}${headerInfo.subheaderRow}`
    });

    const subheaderRow = response.data.values?.[0] ?? [];
    const durationHeader = normalize(subheaderRow[playerInfo.columns.duration]);
    const activityHeader = normalize(subheaderRow[playerInfo.columns.activity]);
    const scoreHeader = playerInfo.columns.score !== undefined ? normalize(subheaderRow[playerInfo.columns.score]) : "score";

    if (durationHeader !== "duration (hh:mm)" || activityHeader !== "activity" || scoreHeader !== "score") {
      throw new Error("Sheet columns did not pass safety validation. No data was written.");
    }
  }

  async getRowState({ durationColumn, activityColumn, scoreColumn }, row) {
    const range = scoreColumn
      ? `${this.sheetName}!${durationColumn}${row}:${scoreColumn}${row}`
      : `${this.sheetName}!${durationColumn}${row}:${activityColumn}${row}`;

    const response = await this.sheets.spreadsheets.values.get({
      spreadsheetId: this.spreadsheetId,
      range,
      valueRenderOption: "UNFORMATTED_VALUE"
    });

    const values = response.data.values?.[0] ?? [];
    const existingDuration = String(values[0] ?? "").trim();
    const existingActivity = String(values[1] ?? "").trim();
    const existingScore = scoreColumn ? String(values[3] ?? "").trim() : "";

    return {
      existingDuration,
      existingActivity,
      existingScore,
      hasExistingDuration: Boolean(existingDuration),
      hasExistingActivity: Boolean(existingActivity) && existingActivity !== "-",
      hasScore: Boolean(existingScore)
    };
  }

  async findSuggestedDate({ dateRows, normalizedDate, durationColumn, activityColumn, scoreColumn }) {
    const olderRows = dateRows
      .filter((item) => item.date < normalizedDate)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    const rowsToCheck = olderRows.slice(0, MAX_SUGGESTION_ROW_CHECKS);

    for (const rowInfo of rowsToCheck) {
      const rowState = await this.getRowState({ durationColumn, activityColumn, scoreColumn }, rowInfo.row);
      if (!rowState.hasScore) {
        return { date: rowInfo.date, row: rowInfo.row };
      }
    }

    return {
      suggestion: null,
      checkedCount: rowsToCheck.length,
      reachedCheckLimit: olderRows.length > MAX_SUGGESTION_ROW_CHECKS
    };
  }

  async upsertPlayerEntry({ player, date, duration, activity }) {
    const headerInfo = await this.getHeaderInfo();
    const playerInfo = headerInfo.players.find((p) => p.player === player);

    if (!playerInfo) {
      throw new Error(`Unknown player: ${player}`);
    }

    if (!this.activityOptions.includes(activity)) {
      throw new Error("Invalid activity option.");
    }

    const normalizedDate = normalizeDateInput(date);
    const trimmedDuration = String(duration ?? "").trim();
    if (!trimmedDuration) {
      throw new Error("Duration is required.");
    }

    const dateRows = await this.getDateRows(500);
    const targetRowInfo = dateRows.find((item) => item.date === normalizedDate);

    if (!targetRowInfo) {
      throw new Error("Selected date was not found in existing sheet rows. Choose a date that already exists.");
    }

    const targetRow = targetRowInfo.row;
    const durationColumn = columnIndexToLetter(playerInfo.columns.duration);
    const activityColumn = columnIndexToLetter(playerInfo.columns.activity);
    const scoreColumn = playerInfo.columns.score !== undefined ? columnIndexToLetter(playerInfo.columns.score) : null;

    await this.assertColumnMappingIsSafe(playerInfo, headerInfo);

    const rowState = await this.getRowState({ durationColumn, activityColumn, scoreColumn }, targetRow);

    if (rowState.hasExistingDuration || rowState.hasExistingActivity) {
      const suggestionResult = await this.findSuggestedDate({
        dateRows,
        normalizedDate,
        durationColumn,
        activityColumn,
        scoreColumn
      });

      const baseMessage = `This row already has data (Duration: ${rowState.existingDuration || "(blank)"}, Activity: ${rowState.existingActivity || "(blank)"}). Update was not applied.`;

      if (suggestionResult?.date) {
        throw buildDateOccupiedError(`${baseMessage} Suggested date: ${suggestionResult.date}.`, suggestionResult);
      }

      if (suggestionResult?.reachedCheckLimit) {
        throw buildDateOccupiedError("All previous rows appear taken. Please select another date.", null);
      }

      throw buildDateOccupiedError("All previous rows appear taken. Please select another date.", null);
    }

    let existingScoreFormulaText = "";
    if (scoreColumn) {
      const scoreStateBeforeWrite = await this.getScoreState(scoreColumn, targetRow);
      existingScoreFormulaText = scoreStateBeforeWrite.formulaText;
    }

    if (this.dryRun) {
      return {
        player,
        date: normalizedDate,
        row: targetRow,
        duration: trimmedDuration,
        activity,
        durationColumn,
        activityColumn,
        score: null,
        dryRun: true
      };
    }

    await this.sheets.spreadsheets.values.batchUpdate({
      spreadsheetId: this.spreadsheetId,
      requestBody: {
        valueInputOption: "USER_ENTERED",
        data: [
          { range: `${this.sheetName}!${durationColumn}${targetRow}`, values: [[trimmedDuration]] },
          { range: `${this.sheetName}!${activityColumn}${targetRow}`, values: [[activity]] }
        ]
      }
    });

    const score = scoreColumn ? await this.getScoreValue(scoreColumn, targetRow, existingScoreFormulaText) : null;

    return {
      player,
      date: normalizedDate,
      row: targetRow,
      duration: trimmedDuration,
      activity,
      durationColumn,
      activityColumn,
      score
    };
  }
}

module.exports = { SheetsService };
