const { daysBetween } = require("./dateUtil");

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

/**
 * Computes the next streak/history state for completing a task "now".
 * Does not persist - caller is responsible for saving the task.
 */
function applyCompletion(task, now = new Date()) {
  const { lastCompletedDate, currentStreak } = task;

  let nextStreak;
  if (!lastCompletedDate) {
    nextStreak = 1;
  } else {
    const gap = daysBetween(lastCompletedDate, now);
    if (gap === 0) {
      throw new AlreadyCompletedTodayError();
    } else if (gap === 1) {
      nextStreak = currentStreak + 1;
    } else {
      nextStreak = 1;
    }
  }

  return {
    currentStreak: nextStreak,
    completionHistory: [...task.completionHistory, now],
    lastCompletedDate: now,
  };
}

module.exports = { applyCompletion, flameTierForStreak, AlreadyCompletedTodayError, FLAME_TIERS };
