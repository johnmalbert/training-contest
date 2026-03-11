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
const suggestionAppendButton = document.getElementById("suggestionAppendButton");
const decisionCardEl = document.getElementById("decisionCard");
const decisionMessageEl = document.getElementById("decisionMessage");
const decisionAcceptButton = document.getElementById("decisionAcceptButton");
const decisionCancelButton = document.getElementById("decisionCancelButton");
const celebrationEl = document.getElementById("celebration");
const celebrationMessageEl = document.getElementById("celebrationMessage");
const celebrationGifEl = document.getElementById("celebrationGif");
const defaultSubmitLabel = submitButton.textContent;
let pendingSuggestion = null;
let pendingDecisionResolver = null;

const WORKING_GIFS = [
  "https://media0.giphy.com/media/v1.Y2lkPTc5MGI3NjExbHFsY2FpMWx1c251eWQ3YmxjaDF3Nmljbm8ya25iZmJic2xtdDJlZyZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/QTrG6mjkHEkpFR3DqX/giphy.gif",
  "https://media.giphy.com/media/v1.Y2lkPWVjZjA1ZTQ3NjJ1NWc5NnRqNTlidHJjOGh3eWlxZ21rdzE4dzRvbWNwdG1vY2FzNCZlcD12MV9naWZzX3JlbGF0ZWQmY3Q9Zw/mEYkuPOOyHcYn5xgDP/giphy.gif",
  "https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExcW8xMXdmY3o5aHcxMDF3Ym51YTF2dGdjYXI5NXN2eHdtajRzMWI3cyZlcD12MV9naWZzX3NlYXJjaCZjdD1n/blEl99OgPQnNS/giphy.gif",
  "https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExMGhxdW1pMTBzdmMwbWtpaGl0eGFrcWpoMDA3MzJjMDJmOG42enRkdCZlcD12MV9naWZzX3NlYXJjaCZjdD1n/MOWPkhRAUbR7i/giphy.gif",
  "https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExeHo0eGJxY2ZzaXZ4aWl4MWxpMGl4ZWhrcmp6bWkwcjhpeXBrbjk0bSZlcD12MV9naWZzX3NlYXJjaCZjdD1n/EO59xGjMkWPhlWtMoc/giphy.gif",
  "https://media.giphy.com/media/v1.Y2lkPWVjZjA1ZTQ3MnBheDd3YWtpdGt5Mnhzd2xra3p0cXgwYTA4eG0ybmFtb2o0Y2N2dyZlcD12MV9naWZzX3NlYXJjaCZjdD1n/mjFghXHxT5ir8LLdsC/giphy.gif",
  "https://media.giphy.com/media/v1.Y2lkPWVjZjA1ZTQ3ZWM2dmMxcDduZm93ODY5b2ticXl0a2p6dDNiamphd2MxeTVxbXNveCZlcD12MV9naWZzX3NlYXJjaCZjdD1n/TPUMgbPw9y0fTSfFgs/giphy.gif",
  "https://media.giphy.com/media/v1.Y2lkPWVjZjA1ZTQ3bm9ibXZpM211dXBjZ2Nub3F6aTQ3ZW96NG85M21zbzVkNzVjMHJhMiZlcD12MV9naWZzX3NlYXJjaCZjdD1n/MTZ5fSq0pLWgHHU8uU/giphy.gif",
  "https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExZnNtNGxwZnQ0Y3UyZWplMXQyc2xpZ2k2M2tqNHNnbnQ5dzQxczRkayZlcD12MV9naWZzX3NlYXJjaCZjdD1n/CWKcLd53mbw0o/giphy.gif",
  "https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExZnNtNGxwZnQ0Y3UyZWplMXQyc2xpZ2k2M2tqNHNnbnQ5dzQxczRkayZlcD12MV9naWZzX3NlYXJjaCZjdD1n/SVH9y2LQUVVCRcqD7o/giphy.gif",
  "https://media3.giphy.com/media/v1.Y2lkPTc5MGI3NjExc2Jpc2cza2xjcHZvcjA1ZWNvd3F6anQzcmwycjVraDZuYXF1NmlwZiZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/3o7bukMYQO9OhjzzTG/giphy.gif"
];

const DEFAULT_GIF = WORKING_GIFS[0];
let currentGifIndex = 0;

function getRandomGif() {
  if (!WORKING_GIFS.length) {
    return DEFAULT_GIF;
  }

  const randomIndex = Math.floor(Math.random() * WORKING_GIFS.length);
  return WORKING_GIFS[randomIndex];
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

function hideDecision() {
  decisionCardEl.classList.add("hidden");
  decisionMessageEl.textContent = "";
  decisionAcceptButton.textContent = "Yes";
  decisionCancelButton.textContent = "No";
  pendingDecisionResolver = null;
}

function showDecision({ message, acceptLabel = "Yes", cancelLabel = "No" }) {
  hideSuggestion();
  decisionMessageEl.textContent = message;
  decisionAcceptButton.textContent = acceptLabel;
  decisionCancelButton.textContent = cancelLabel;
  decisionCardEl.classList.remove("hidden");

  return new Promise((resolve) => {
    pendingDecisionResolver = resolve;
  });
}

function showSuggestion({ message, suggestedDate, payload, mergePreview }) {
  pendingSuggestion = { suggestedDate, payload };
  const existingMinutes = Number(mergePreview?.existingMinutes);
  const existingDuration = Number.isFinite(existingMinutes)
    ? `${Math.floor(existingMinutes / 60)}:${String(existingMinutes % 60).padStart(2, "0")}`
    : String(mergePreview?.existingDuration || "").trim();
  const existingActivity = String(mergePreview?.existingActivity || "").trim();
  const existingWorkoutText =
    existingDuration && existingActivity ? ` (${existingDuration} ${existingActivity})` : "";

  suggestionMessageEl.textContent = `You already have a score for this date${existingWorkoutText}. You can use ${formatDateLabel(suggestedDate)}, overwrite the existing score for this date, or append this workout to the existing score.`;
  suggestionCardEl.classList.remove("hidden");
}

function setSubmitting(isSubmitting) {
  submitButton.disabled = isSubmitting;
  submitButton.textContent = isSubmitting ? "Saving..." : defaultSubmitLabel;
  suggestionAcceptButton.disabled = isSubmitting;
  suggestionCancelButton.disabled = isSubmitting;
  suggestionAppendButton.disabled = isSubmitting;
  decisionAcceptButton.disabled = isSubmitting;
  decisionCancelButton.disabled = isSubmitting;
}

function hideCelebration() {
  celebrationEl.classList.add("hidden");
  celebrationEl.classList.remove("big");
  celebrationMessageEl.textContent = "";
  celebrationGifEl.src = DEFAULT_GIF;
  currentGifIndex = WORKING_GIFS.indexOf(DEFAULT_GIF);
}

function showCelebration({ player, score, duration, activity }) {
  const scoreText = score === null || score === undefined || score === "" ? "(not ready yet)" : score;
  const durationText = duration ? String(duration).trim() : "";
  const activityText = activity ? String(activity).trim() : "";
  const workoutText = durationText && activityText ? ` (${durationText} ${activityText})` : "";
  const scoreNumber = Number(score);
  const isBigCelebration = Number.isFinite(scoreNumber) && scoreNumber > 10;

  const selectedGif = getRandomGif();
  celebrationGifEl.src = selectedGif;
  currentGifIndex = WORKING_GIFS.indexOf(selectedGif);
  celebrationEl.classList.toggle("big", isBigCelebration);
  celebrationMessageEl.textContent = `Good job, ${player}! Your score is ${scoreText}${workoutText}.`;
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
    error.mergePreview = payload.mergePreview;
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
  hideDecision();
  const mergedWorkoutSummary = Array.isArray(result.combinedWorkouts)
    ? result.combinedWorkouts
      .map((item) => `${item.activity} ${item.duration}`)
      .join(" + ")
    : "";

  const baseMessage = result.merged
    ? mergedWorkoutSummary
      ? `${mergedWorkoutSummary} → ${result.activity} ${result.duration}.`
      : `${result.activity} ${result.duration}.`
    : `Saved for ${result.player} on ${result.date} (row ${result.row}).`;
  setStatus(baseMessage, "success");
  showCelebration({
    player: result.player,
    score: result.score,
    duration: result.duration,
    activity: result.activity
  });
}

async function askToAddAnotherSameDay() {
  return showDecision({
    message: "Do you want to add another workout for this same day?",
    acceptLabel: "Add Another",
    cancelLabel: "Done"
  });
}

function buildMergeConfirmMessage(error) {
  const preview = error?.mergePreview;

  if (!preview) {
    return `${error.message}\n\nDo you want to add this workout to the same day by converting points into equivalent duration for the higher-scoring activity?`;
  }

  const existingMinutes = Number(preview.existingMinutes);
  const incomingMinutes = Number(preview.incomingMinutes);
  const existingMultiplier = Number(preview.existingMultiplier);
  const incomingMultiplier = Number(preview.incomingMultiplier);
  const existingPoints = Number(preview.existingPoints);
  const incomingPoints = Number(preview.incomingPoints);
  const projectedScore = Number(preview.projectedScore);
  const convertedWorkoutMinutes = Number(preview.convertedWorkoutMinutes);
  const convertedWorkoutPoints = Number(preview.convertedWorkoutPoints);
  const appendMinutes = Number(preview.appendMinutes);
  const basisMultiplier = Number(preview.basisMultiplier);
  const basisActivity = String(preview.basisActivity || preview.existingActivity || "").trim();
  const convertedWorkoutActivity = String(preview.convertedWorkoutActivity || "").trim();
  const existingActivity = String(preview.existingActivity || "").trim();
  const incomingActivity = String(preview.incomingActivity || "").trim();

  const formatScore = (value) => {
    if (!Number.isFinite(value)) {
      return "?";
    }

    return Number.isInteger(value) ? String(value) : value.toFixed(1).replace(/\.0$/, "");
  };

  const formatMinutesLabel = (minutes) => {
    if (!Number.isFinite(minutes)) {
      return "unknown duration";
    }

    const wholeMinutes = Math.round(minutes);
    return `${wholeMinutes} minute${wholeMinutes === 1 ? "" : "s"}`;
  };

  const existingMath = Number.isFinite(existingMinutes) && Number.isFinite(existingMultiplier) && Number.isFinite(existingPoints)
    ? `${existingActivity}: ${existingMinutes} × 0.1 × ${existingMultiplier} = ${formatScore(existingPoints)}`
    : `${existingActivity}`;

  const incomingMath = Number.isFinite(incomingMinutes) && Number.isFinite(incomingMultiplier) && Number.isFinite(incomingPoints)
    ? `${incomingActivity}: ${incomingMinutes} × 0.1 × ${incomingMultiplier} = ${formatScore(incomingPoints)}`
    : `${incomingActivity}`;

  const totalMath = Number.isFinite(existingPoints) && Number.isFinite(incomingPoints) && Number.isFinite(projectedScore)
    ? `Total score: ${formatScore(existingPoints)} + ${formatScore(incomingPoints)} = ${formatScore(projectedScore)}`
    : `Total score: ${preview.projectedScore}`;

  let conversionMath = `Converted ${convertedWorkoutActivity} into ${basisActivity} minutes: +${preview.appendMinutes}`;

  if (
    Number.isFinite(convertedWorkoutMinutes) &&
    Number.isFinite(convertedWorkoutPoints) &&
    Number.isFinite(basisMultiplier) &&
    basisMultiplier > 0 &&
    Number.isFinite(appendMinutes)
  ) {
    conversionMath = `Converted ${convertedWorkoutActivity} into ${basisActivity} minutes: ${formatScore(convertedWorkoutPoints)} ÷ (0.1 × ${basisMultiplier}) = ${appendMinutes}`;
  }

  const existingSummary = Number.isFinite(existingMinutes) && Number.isFinite(existingPoints)
    ? `This date already has a ${formatMinutesLabel(existingMinutes)} ${existingActivity} (${formatScore(existingPoints)} points).`
    : `This date already has an existing ${existingActivity} workout.`;

  return `${existingSummary}\n\nWorkout math:\n${existingMath}\n${incomingMath}\n\n${totalMath}\n\nMerge conversion:\nUse ${basisActivity} as the merged activity (higher scoring basis).\n${conversionMath}\n\nFinal merged duration: ${preview.mergedDuration}.\n\nContinue?`;
}

function prepareForAnotherSameDayEntry() {
  durationInput.value = "";
  activitySelect.value = "Run";
  hideSuggestion();
  updateSubmitEnabled();
  setStatus("Enter another workout for the same day.");
  durationInput.focus();
}

async function askToMergeSameDay(error) {
  return showDecision({
    message: buildMergeConfirmMessage(error),
    acceptLabel: "Append Workout",
    cancelLabel: "No"
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
  const year = copy.getFullYear();
  const month = String(copy.getMonth() + 1).padStart(2, "0");
  const day = String(copy.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
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
  hideDecision();
  hideCelebration();

  const playersResult = await api("/api/players");
  const datesResult = await api("/api/dates?limit=90");

  if (!Array.isArray(playersResult?.players)) {
    throw new Error(
      "Could not load players from API. Check your Azure Static Web App API configuration and environment variables."
    );
  }

  if (!Array.isArray(playersResult?.activityOptions)) {
    throw new Error("Could not load activity options from API.");
  }

  if (!Array.isArray(datesResult?.dates)) {
    throw new Error("Could not load dates from API.");
  }

  playerSelect.innerHTML = "";
  const placeholderOption = document.createElement("option");
  placeholderOption.value = "";
  placeholderOption.textContent = "Select Contender";
  placeholderOption.selected = true;
  placeholderOption.disabled = true;
  playerSelect.append(placeholderOption);

  playersResult.players.forEach((item) => {
    const option = document.createElement("option");
    option.value = item.player;
    option.textContent = item.player;
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
    setSubmitting(false);
    if (await askToAddAnotherSameDay()) {
      prepareForAnotherSameDayEntry();
    }
  } catch (error) {
    if (error.code === "DATE_ALREADY_POPULATED") {
      setSubmitting(false);
      if (error.suggestion?.date) {
        showSuggestion({
          message: error.message,
          suggestedDate: error.suggestion.date,
          payload,
          mergePreview: error.mergePreview
        });
        setStatus("");
        hideCelebration();
      } else {
        const shouldMergeSameDay = await askToMergeSameDay(error);

        if (shouldMergeSameDay) {
          try {
            setSubmitting(true);
            setStatus("Submitting...");
            const mergedResult = await api("/api/entry", {
              method: "POST",
              body: JSON.stringify({
                ...payload,
                addToSameDay: true
              })
            });

            applySuccess(mergedResult.result);
            setSubmitting(false);
            if (await askToAddAnotherSameDay()) {
              prepareForAnotherSameDayEntry();
            }
          } catch (mergeError) {
            setStatus(mergeError.message, "error");
            hideCelebration();
          }
        } else {
          setStatus(error.message, "error");
          hideCelebration();
        }
      }
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
    setSubmitting(false);
    if (await askToAddAnotherSameDay()) {
      prepareForAnotherSameDayEntry();
    }
  } catch (error) {
    setStatus(error.message, "error");
    hideCelebration();
  } finally {
    setSubmitting(false);
    updateSubmitEnabled();
  }
}

function cancelSuggestedDate() {
  if (!pendingSuggestion) {
    return;
  }

  const overwritePayload = {
    ...pendingSuggestion.payload,
    overwriteExisting: true
  };

  setSubmitting(true);
  setStatus("Overwriting existing score...");

  (async () => {
    try {
      const result = await api("/api/entry", {
        method: "POST",
        body: JSON.stringify(overwritePayload)
      });

      applySuccess(result.result);
      setSubmitting(false);
      if (await askToAddAnotherSameDay()) {
        prepareForAnotherSameDayEntry();
      }
    } catch (error) {
      setStatus(error.message, "error");
      hideCelebration();
    } finally {
      setSubmitting(false);
      updateSubmitEnabled();
    }
  })();
}

async function appendSuggestedWorkout() {
  if (!pendingSuggestion) {
    return;
  }

  const appendPayload = {
    ...pendingSuggestion.payload,
    addToSameDay: true
  };

  setSubmitting(true);
  setStatus("Appending workout...");

  try {
    const result = await api("/api/entry", {
      method: "POST",
      body: JSON.stringify(appendPayload)
    });

    applySuccess(result.result);
    setSubmitting(false);
    if (await askToAddAnotherSameDay()) {
      prepareForAnotherSameDayEntry();
    }
  } catch (error) {
    setStatus(error.message, "error");
    hideCelebration();
  } finally {
    setSubmitting(false);
    updateSubmitEnabled();
  }
}

function resolveDecision(value) {
  if (!pendingDecisionResolver) {
    return;
  }

  const resolve = pendingDecisionResolver;
  pendingDecisionResolver = null;
  hideDecision();
  resolve(Boolean(value));
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
suggestionAppendButton.addEventListener("click", appendSuggestedWorkout);
decisionAcceptButton.addEventListener("click", () => resolveDecision(true));
decisionCancelButton.addEventListener("click", () => resolveDecision(false));

loadData().catch((error) => {
  setStatus(error.message, "error");
});
