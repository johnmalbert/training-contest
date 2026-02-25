import "dotenv/config";
import express from "express";
import fs from "node:fs";
import path from "node:path";
import { SheetsService } from "./sheetsService.js";

const app = express();
const port = Number(process.env.PORT || 3000);

let sheetsService;

try {
  sheetsService = new SheetsService();
} catch (error) {
  console.error("Failed to initialize Sheets service:", error.message);
}

app.use(express.json());

const distPath = path.resolve(process.cwd(), "dist");
const hasDist = fs.existsSync(distPath);

if (hasDist) {
  app.use(express.static(distPath));
}

app.get("/api/health", (_req, res) => {
  res.json({ ok: true, configured: Boolean(sheetsService) });
});

app.get("/api/players", async (_req, res) => {
  if (!sheetsService) {
    return res.status(500).json({
      error: "Server is not configured. Check Google Sheets environment variables."
    });
  }

  try {
    const result = await sheetsService.getPlayers();
    return res.json(result);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

app.get("/api/dates", async (req, res) => {
  if (!sheetsService) {
    return res.status(500).json({
      error: "Server is not configured. Check Google Sheets environment variables."
    });
  }

  const limit = Number(req.query.limit || 60);

  try {
    const dates = await sheetsService.getRecentDates(limit);
    return res.json({ dates });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

app.post("/api/entry", async (req, res) => {
  if (!sheetsService) {
    return res.status(500).json({
      error: "Server is not configured. Check Google Sheets environment variables."
    });
  }

  try {
    const result = await sheetsService.upsertPlayerEntry(req.body);
    return res.json({ ok: true, result });
  } catch (error) {
    if (error.code === "DATE_ALREADY_POPULATED") {
      return res.status(409).json({
        error: error.message,
        code: error.code,
        suggestion: error.suggestion ?? null
      });
    }

    return res.status(400).json({ error: error.message });
  }
});

if (hasDist) {
  app.get("*", (req, res, next) => {
    if (req.path.startsWith("/api/")) {
      return next();
    }

    return res.sendFile(path.join(distPath, "index.html"));
  });
}

app.listen(port, () => {
  console.log(`Server listening on http://localhost:${port}`);
});
