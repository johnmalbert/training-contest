import "./styles.css";

const playerSelect = document.getElementById("playerSelect");
const dateSelect = document.getElementById("dateSelect");
const durationInput = document.getElementById("durationInput");
const activitySelect = document.getElementById("activitySelect");
const submitButton = document.getElementById("submitButton");
const statusEl = document.getElementById("status");
const suggestionCardEl = document.getElementById("suggestionCard");
const suggestionMessageEl = document.getElementById("suggestionMessage");
const suggestionAcceptButton = document.getElementById("suggestionAcceptButton");
const suggestionCancelButton = document.getElementById("suggestionCancelButton");
const celebrationEl = document.getElementById("celebration");
const celebrationMessageEl = document.getElementById("celebrationMessage");
const celebrationGifEl = document.getElementById("celebrationGif");
const defaultSubmitLabel = submitButton.textContent;
let pendingSuggestion = null;

const WORKING_GIFS = [
  "https://media.giphy.com/media/xT9IgG50Fb7Mi0prBC/giphy.gif",
  "https://media.giphy.com/media/12XDYvMJNcmLgQ/giphy.gif",
  "https://media.tenor.com/1mwdqr51emcAAAAd/happy-dance.gif",
  "https://media.tenor.com/yCFHzEvKa9MAAAAC/party-time.gif",
  "https://media.tenor.com/2roX3uxz_68AAAAC/cat-space.gif",
  "https://media.tenor.com/5ry-200hErMAAAAC/happy-dance-cat.gif",
  "https://media.tenor.com/3x63SNMKPogAAAAC/minions-celebrate.gif",
  "https://media.tenor.com/uUNcnHwYJQEAAAAC/rick-roll.gif"
];

const CELEBRATION_TIERS = [
  { maxScore: 5, gif: WORKING_GIFS[0] },
  { maxScore: 10, gif: WORKING_GIFS[1] },
  { maxScore: 15, gif: WORKING_GIFS[2] },
  { maxScore: 20, gif: WORKING_GIFS[3] },
  { maxScore: 25, gif: WORKING_GIFS[4] },
  { maxScore: 30, gif: WORKING_GIFS[5] },
  { maxScore: Infinity, gif: WORKING_GIFS[6] }
];

const DEFAULT_GIF = CELEBRATION_TIERS[0].gif;
let currentGifIndex = 0;

function getGifForScore(scoreNumber) {
  if (!Number.isFinite(scoreNumber)) {
    return DEFAULT_GIF;
  }

  const tier = CELEBRATION_TIERS.find((item) => scoreNumber <= item.maxScore);
  return tier ? tier.gif : DEFAULT_GIF;
}

celebrationGifEl.addEventListener("error", () => {
  currentGifIndex = (currentGifIndex + 1) % WORKING_GIFS.length;
  const nextGif = WORKING_GIFS[currentGifIndex];
  if (celebrationGifEl.src !== nextGif) {
    celebrationGifEl.src = nextGif;
  }
});

function setStatus(message, type = "") {
  statusEl.textContent = message || "";
  statusEl.classList.remove("error", "success");
  if (type) {
    statusEl.classList.add(type);
  }
}

function hideSuggestion() {
  pendingSuggestion = null;
  suggestionCardEl.classList.add("hidden");
  suggestionMessageEl.textContent = "";
}

function showSuggestion({ message, suggestedDate, payload }) {
  pendingSuggestion = { suggestedDate, payload };
  suggestionMessageEl.textContent = `You already have a score for this date. Want to add this score to ${formatDateLabel(suggestedDate)} instead?`;
  suggestionCardEl.classList.remove("hidden");
}

function setSubmitting(isSubmitting) {
  submitButton.disabled = isSubmitting;
  submitButton.textContent = isSubmitting ? "Saving..." : defaultSubmitLabel;
  suggestionAcceptButton.disabled = isSubmitting;
  suggestionCancelButton.disabled = isSubmitting;
}

function hideCelebration() {
  celebrationEl.classList.add("hidden");
  celebrationEl.classList.remove("big");
  celebrationMessageEl.textContent = "";
  celebrationGifEl.src = DEFAULT_GIF;
  currentGifIndex = WORKING_GIFS.indexOf(DEFAULT_GIF);
}

function showCelebration({ player, score }) {
  const scoreText = score === null || score === undefined || score === "" ? "(not ready yet)" : score;
  const scoreNumber = Number(score);
  const isBigCelebration = Number.isFinite(scoreNumber) && scoreNumber > 10;

  const selectedGif = getGifForScore(scoreNumber);
  celebrationGifEl.src = selectedGif;
  currentGifIndex = WORKING_GIFS.indexOf(selectedGif);
  celebrationEl.classList.toggle("big", isBigCelebration);
  celebrationMessageEl.textContent = `Good job, ${player}! Your score is ${scoreText}.`;
  celebrationEl.classList.remove("hidden");
}

async function api(path, options = {}) {
  const response = await fetch(path, {
    headers: { "Content-Type": "application/json" },
    ...options
  });

  const rawText = await response.text();
  let payload = {};

  if (rawText) {
    try {
      payload = JSON.parse(rawText);
    } catch {
      payload = { error: rawText };
    }
  }

  if (!response.ok) {
    const error = new Error(payload.error || `Request failed (${response.status}).`);
    error.status = response.status;
    error.code = payload.code;
    error.suggestion = payload.suggestion;
    throw error;
  }

  return payload;
}

function ensureDateOption(isoDate) {
  let option = [...dateSelect.options].find((item) => item.value === isoDate);
  if (!option) {
    option = document.createElement("option");
    option.value = isoDate;
    option.textContent = formatDateLabel(isoDate);
    dateSelect.prepend(option);
  }
  dateSelect.value = isoDate;
}

function applySuccess(result) {
  hideSuggestion();
  setStatus(`Saved for ${result.player} on ${result.date} (row ${result.row}).`, "success");
  showCelebration({
    player: result.player,
    score: result.score
  });
}

function validateDuration(value) {
  return /^\d{1,3}:\d{2}$/.test(String(value).trim());
}

function updateSubmitEnabled() {
  const canSubmit =
    playerSelect.value &&
    dateSelect.value &&
    validateDuration(durationInput.value) &&
    activitySelect.value;

  submitButton.disabled = !canSubmit;
}

function toIsoDateOnly(date) {
  const copy = new Date(date);
  copy.setHours(0, 0, 0, 0);
  return copy.toISOString().slice(0, 10);
}

function formatDateLabel(isoDate) {
  const date = new Date(`${isoDate}T00:00:00`);
  if (Number.isNaN(date.getTime())) {
    return isoDate;
  }

  const weekday = date.toLocaleDateString(undefined, { weekday: "short" });
  const monthDay = date.toLocaleDateString(undefined, { month: "short", day: "numeric" });
  const todayIso = toIsoDateOnly(new Date());

  if (isoDate === todayIso) {
    return `Today · ${weekday}, ${monthDay}`;
  }

  return `${weekday}, ${monthDay}`;
}

function buildDateChoices(allDates) {
  const sortedAsc = [...new Set((allDates || []).filter(Boolean))].sort((a, b) =>
    new Date(a).getTime() - new Date(b).getTime()
  );

  if (!sortedAsc.length) {
    return { options: [], defaultDate: "" };
  }

  const todayIso = toIsoDateOnly(new Date());
  const pastOrToday = sortedAsc.filter((date) => date <= todayIso);
  const future = sortedAsc.filter((date) => date > todayIso);

  const defaultDate =
    sortedAsc.includes(todayIso) ? todayIso : (pastOrToday[pastOrToday.length - 1] ?? sortedAsc[0]);

  const pastWindow = pastOrToday.slice(-5);
  const futureWindow = future.slice(0, 5);

  const options = [
    defaultDate,
    ...pastWindow.filter((date) => date !== defaultDate).reverse(),
    ...futureWindow
  ];

  return {
    options: [...new Set(options)].slice(0, 10),
    defaultDate
  };
}

async function loadData() {
  setStatus("Loading players...");
  hideSuggestion();
  hideCelebration();

  const playersResult = await api("/api/players");
  const datesResult = await api("/api/dates?limit=90");

  playerSelect.innerHTML = "";

  playersResult.players.forEach((item, index) => {
    const option = document.createElement("option");
    option.value = item.player;
    option.textContent = item.player;
    if (index === 0) {
      option.selected = true;
    }
    playerSelect.append(option);
  });

  activitySelect.innerHTML = "";
  playersResult.activityOptions.forEach((activity) => {
    const option = document.createElement("option");
    option.value = activity;
    option.textContent = activity;
    activitySelect.append(option);
  });

  const dateChoices = buildDateChoices(datesResult.dates || []);

  dateSelect.innerHTML = "";
  dateChoices.options.forEach((date, index) => {
    const option = document.createElement("option");
    option.value = date;
    option.textContent = formatDateLabel(date);
    if (date === dateChoices.defaultDate || index === 0) {
      option.selected = true;
    }
    dateSelect.append(option);
  });

  if (!dateChoices.options.length) {
    setStatus("No existing date rows were found in the sheet.", "error");
    submitButton.disabled = true;
    playerSelect.disabled = false;
    dateSelect.disabled = true;
    return;
  }

  playerSelect.disabled = false;
  dateSelect.disabled = false;
  submitButton.disabled = false;
  updateSubmitEnabled();
  setStatus("Ready.");
}

async function submitEntry() {
  hideSuggestion();
  hideCelebration();

  const payload = {
    player: playerSelect.value,
    date: dateSelect.value,
    duration: durationInput.value.trim(),
    activity: activitySelect.value
  };

  if (!validateDuration(payload.duration)) {
    setStatus("Duration must be in hh:mm format, for example 0:36.", "error");
    updateSubmitEnabled();
    return;
  }

  setSubmitting(true);
  setStatus("Submitting...");

  try {
    const result = await api("/api/entry", {
      method: "POST",
      body: JSON.stringify(payload)
    });

    applySuccess(result.result);
  } catch (error) {
    if (error.code === "DATE_ALREADY_POPULATED" && error.suggestion?.date) {
      showSuggestion({
        message: error.message,
        suggestedDate: error.suggestion.date,
        payload
      });
      setStatus("");
      hideCelebration();
    } else {
      setStatus(error.message, "error");
      hideCelebration();
    }
  } finally {
    setSubmitting(false);
    updateSubmitEnabled();
  }
}

async function applySuggestedDate() {
  if (!pendingSuggestion) {
    return;
  }

  const retryPayload = {
    ...pendingSuggestion.payload,
    date: pendingSuggestion.suggestedDate
  };

  setSubmitting(true);
  setStatus(`Submitting to ${formatDateLabel(retryPayload.date)}...`);

  try {
    const retryResult = await api("/api/entry", {
      method: "POST",
      body: JSON.stringify(retryPayload)
    });

    ensureDateOption(retryPayload.date);
    applySuccess(retryResult.result);
  } catch (error) {
    setStatus(error.message, "error");
    hideCelebration();
  } finally {
    setSubmitting(false);
    updateSubmitEnabled();
  }
}

function cancelSuggestedDate() {
  hideSuggestion();
  setStatus("Suggestion dismissed. Choose a different date to continue.", "error");
}

[playerSelect, dateSelect, durationInput, activitySelect].forEach((el) => {
  el.addEventListener("input", () => {
    if (el === durationInput && durationInput.value && !validateDuration(durationInput.value)) {
      setStatus("Duration should look like hh:mm, example 0:36.");
    } else {
      setStatus("");
    }
    updateSubmitEnabled();
  });
});

submitButton.addEventListener("click", submitEntry);
suggestionAcceptButton.addEventListener("click", applySuggestedDate);
suggestionCancelButton.addEventListener("click", cancelSuggestedDate);

loadData().catch((error) => {
  setStatus(error.message, "error");
});
