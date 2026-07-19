const { isSameDay, startOfWeek, startOfMonth } = require("./dateUtil");

const FREQUENCIES = ["Daily", "Weekly", "Monthly", "One-Time"];

function periodKey(frequency, date) {
  if (frequency === "Weekly") return startOfWeek(date).getTime();
  if (frequency === "Monthly") return startOfMonth(date).getTime();
  return null;
}

/** Count of completions falling in the same day/week/month as `now`, per the task's frequency. */
function countCompletionsInCurrentPeriod(task, now = new Date()) {
  const { frequency, completionHistory } = task;

  if (frequency === "Daily") {
    return completionHistory.filter((d) => isSameDay(d, now)).length;
  }
  if (frequency === "Weekly" || frequency === "Monthly") {
    const currentKey = periodKey(frequency, now);
    return completionHistory.filter((d) => periodKey(frequency, d) === currentKey).length;
  }
  // One-Time
  return completionHistory.length;
}

/** Whether this task has nothing left to do for its current period (and should drop off active lists). */
function isDoneForCurrentPeriod(task, now = new Date()) {
  const { frequency, targetCount } = task;

  if (frequency === "Weekly") {
    return countCompletionsInCurrentPeriod(task, now) >= targetCount;
  }
  if (frequency === "Monthly") {
    return countCompletionsInCurrentPeriod(task, now) >= 1;
  }
  if (frequency === "One-Time") {
    return countCompletionsInCurrentPeriod(task, now) > 0;
  }
  // Daily
  return Boolean(task.lastCompletedDate) && isSameDay(task.lastCompletedDate, now);
}

module.exports = { FREQUENCIES, periodKey, countCompletionsInCurrentPeriod, isDoneForCurrentPeriod };
