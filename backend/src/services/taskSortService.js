const NO_DUE_DATE_SENTINEL = Infinity;

function dueDateValue(task) {
  return task.dueDate ? new Date(task.dueDate).getTime() : NO_DUE_DATE_SENTINEL;
}

/**
 * Orders optional (non-must-do) tasks: shortest estimated time first, then most
 * historically completed (habitual = easier), then soonest due date (no
 * due date sorts last).
 */
function compareOptionalTasks(a, b) {
  const minutesDelta = a.estimatedMinutes - b.estimatedMinutes;
  if (minutesDelta !== 0) return minutesDelta;

  const historyDelta = (b.completionHistory?.length || 0) - (a.completionHistory?.length || 0);
  if (historyDelta !== 0) return historyDelta;

  return dueDateValue(a) - dueDateValue(b);
}

function sortTasksForCategory(tasks) {
  const mustDo = tasks.filter((t) => t.isMustDo);
  const optional = tasks.filter((t) => !t.isMustDo).sort(compareOptionalTasks);
  return { mustDo, optional };
}

module.exports = { compareOptionalTasks, sortTasksForCategory, dueDateValue };
