const { daysBetween, isSameDay } = require("./dateUtil");
const { periodKey, isDoneForCurrentPeriod } = require("./frequencyService");

const FLAME_TIERS = {
  small: { min: 1, max: 4 },
  big: { min: 5, max: 9 },
  volcano: { min: 10, max: Infinity },
};

function flameTierForStreak(streak) {
  if (streak >= FLAME_TIERS.volcano.min) return "volcano";
  if (streak >= FLAME_TIERS.big.min) return "big";
  if (streak >= FLAME_TIERS.small.min) return "small";
  return "none";
}

class AlreadyCompletedTodayError extends Error {
  constructor() {
    super("Task already completed today");
    this.name = "AlreadyCompletedTodayError";
  }
}

class AlreadyCompletedError extends Error {
  constructor() {
    super("Task already completed");
    this.name = "AlreadyCompletedError";
  }
}

/**
 * Streak transition for a Weekly/Monthly task on the completion that reaches
 * its period target. Increments only if the previous qualifying period was the
 * one immediately before this one; otherwise resets to 1. If the target isn't
 * reached yet this period, the streak is left unchanged.
 */
function nextPeriodStreak(frequency, task, now) {
  const target = frequency === "Weekly" ? task.targetCount : 1;
  const currentKey = periodKey(frequency, now);
  const countThisPeriod =
    task.completionHistory.filter((d) => periodKey(frequency, d) === currentKey).length + 1;

  if (countThisPeriod < target) {
    return task.currentStreak;
  }

  const priorCounts = new Map();
  for (const d of task.completionHistory) {
    const key = periodKey(frequency, d);
    if (key === currentKey) continue;
    priorCounts.set(key, (priorCounts.get(key) || 0) + 1);
  }
  const qualifyingKeys = [...priorCounts.entries()]
    .filter(([, count]) => count >= target)
    .map(([key]) => key)
    .sort((a, b) => b - a);

  const mostRecentQualifying = qualifyingKeys[0];
  if (mostRecentQualifying === undefined) return 1;

  if (frequency === "Weekly") {
    const ONE_WEEK_MS = 7 * 24 * 60 * 60 * 1000;
    return currentKey - mostRecentQualifying === ONE_WEEK_MS ? task.currentStreak + 1 : 1;
  }

  const currentDate = new Date(currentKey);
  const priorDate = new Date(mostRecentQualifying);
  const monthDiff =
    (currentDate.getFullYear() - priorDate.getFullYear()) * 12 + (currentDate.getMonth() - priorDate.getMonth());
  return monthDiff === 1 ? task.currentStreak + 1 : 1;
}

/**
 * Computes the next streak/history state for completing a task "now".
 * Does not persist - caller is responsible for saving the task.
 */
function applyCompletion(task, now = new Date()) {
  const frequency = task.frequency || "Daily";
  const { lastCompletedDate, currentStreak } = task;

  if (frequency === "One-Time" && task.completionHistory.length > 0) {
    throw new AlreadyCompletedError();
  }

  // Daily tasks allow exactly one completion per calendar day. Weekly/Monthly tasks
  // may be completed multiple times in a day toward their period target, so they're
  // only blocked once that target has already been reached (see isDoneForCurrentPeriod).
  if (frequency === "Daily") {
    if (lastCompletedDate && isSameDay(lastCompletedDate, now)) {
      throw new AlreadyCompletedTodayError();
    }
  } else if ((frequency === "Weekly" || frequency === "Monthly") && isDoneForCurrentPeriod(task, now)) {
    throw new AlreadyCompletedError();
  }

  let nextStreak;
  if (frequency === "Weekly" || frequency === "Monthly") {
    nextStreak = nextPeriodStreak(frequency, task, now);
  } else if (frequency === "One-Time") {
    nextStreak = 1;
  } else if (!lastCompletedDate) {
    nextStreak = 1;
  } else {
    const gap = daysBetween(lastCompletedDate, now);
    nextStreak = gap === 1 ? currentStreak + 1 : 1;
  }

  return {
    currentStreak: nextStreak,
    completionHistory: [...task.completionHistory, now],
    lastCompletedDate: now,
  };
}

module.exports = {
  applyCompletion,
  flameTierForStreak,
  AlreadyCompletedTodayError,
  AlreadyCompletedError,
  FLAME_TIERS,
};
