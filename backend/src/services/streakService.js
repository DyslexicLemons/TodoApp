const { daysBetween, isSameDay } = require("./dateUtil");
const { periodKey } = require("./frequencyService");
const { FLAME_TIERS, flameTierForStreak } = require("../../../shared/flameTier");

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

class NothingToUndoError extends Error {
  constructor() {
    super("Task was not completed today");
    this.name = "NothingToUndoError";
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

  if (lastCompletedDate && isSameDay(lastCompletedDate, now)) {
    throw new AlreadyCompletedTodayError();
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

/**
 * Replays completionHistory (ascending) through the same transition rules as
 * applyCompletion, from a blank state, to reconstruct the streak/lastCompletedDate
 * that would have resulted. Used to recompute state after removing an entry.
 */
function computeStreakState(frequency, targetCount, history) {
  let state = { currentStreak: 0, lastCompletedDate: null, completionHistory: [] };

  for (const date of history) {
    let nextStreak;
    if (frequency === "Weekly" || frequency === "Monthly") {
      nextStreak = nextPeriodStreak(frequency, { ...state, targetCount }, date);
    } else if (frequency === "One-Time") {
      nextStreak = 1;
    } else if (!state.lastCompletedDate) {
      nextStreak = 1;
    } else {
      const gap = daysBetween(state.lastCompletedDate, date);
      nextStreak = gap === 1 ? state.currentStreak + 1 : 1;
    }
    state = {
      currentStreak: nextStreak,
      lastCompletedDate: date,
      completionHistory: [...state.completionHistory, date],
    };
  }

  return { currentStreak: state.currentStreak, lastCompletedDate: state.lastCompletedDate };
}

/**
 * Reverses the most recent completion, provided it happened today. Recomputes
 * streak/lastCompletedDate by replaying the remaining history rather than just
 * decrementing, since Weekly/Monthly streaks don't move on every completion.
 * Does not persist - caller is responsible for saving the task.
 */
function undoCompletion(task, now = new Date()) {
  if (!task.lastCompletedDate || !isSameDay(task.lastCompletedDate, now)) {
    throw new NothingToUndoError();
  }

  const frequency = task.frequency || "Daily";
  const sortedHistory = [...task.completionHistory].sort((a, b) => new Date(a) - new Date(b));
  const remainingHistory = sortedHistory.slice(0, -1);
  const { currentStreak, lastCompletedDate } = computeStreakState(frequency, task.targetCount, remainingHistory);

  return {
    currentStreak,
    completionHistory: remainingHistory,
    lastCompletedDate,
  };
}

module.exports = {
  applyCompletion,
  undoCompletion,
  flameTierForStreak,
  AlreadyCompletedTodayError,
  AlreadyCompletedError,
  NothingToUndoError,
  FLAME_TIERS,
};
