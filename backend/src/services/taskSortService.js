const DIFFICULTY_RANK = { Easy: 0, Medium: 1, Hard: 2 };
const NO_DUE_DATE_SENTINEL = Infinity;

function dueDateValue(task) {
  return task.dueDate ? new Date(task.dueDate).getTime() : NO_DUE_DATE_SENTINEL;
}

/**
 * Orders optional (non-must-do) tasks: easiest difficulty first, then most
 * historically completed (habitual = easier), then soonest due date (no
 * due date sorts last).
 */
function compareOptionalTasks(a, b) {
  const difficultyDelta = DIFFICULTY_RANK[a.difficulty] - DIFFICULTY_RANK[b.difficulty];
  if (difficultyDelta !== 0) return difficultyDelta;

  const historyDelta = (b.completionHistory?.length || 0) - (a.completionHistory?.length || 0);
  if (historyDelta !== 0) return historyDelta;

  return dueDateValue(a) - dueDateValue(b);
}

function sortTasksForCategory(tasks) {
  const mustDo = tasks.filter((t) => t.isMustDo);
  const optional = tasks.filter((t) => !t.isMustDo).sort(compareOptionalTasks);
  return { mustDo, optional };
}

module.exports = { compareOptionalTasks, sortTasksForCategory };
