const { Task, LENGTHS } = require("../models/Task");
const { minutesRangeForLength } = require("../services/taskTimeService");
const { sortTasksForCategory } = require("../services/taskSortService");
const { applyCompletion, AlreadyCompletedTodayError, AlreadyCompletedError } = require("../services/streakService");
const { getRandomFact, getEasierTip } = require("../services/factService");
const { isSameDay } = require("../services/dateUtil");
const { isDoneForCurrentPeriod } = require("../services/frequencyService");

async function listByLength(req, res) {
  const { length } = req.query;
  if (!length || !LENGTHS.includes(length)) {
    return res.status(400).json({ error: `length must be one of: ${LENGTHS.join(", ")}` });
  }

  const { min, max } = minutesRangeForLength(length);
  const estimatedMinutes = max === Infinity ? { $gt: min } : { $gt: min, $lte: max };
  const tasks = await Task.find({ estimatedMinutes });
  const activeTasks = tasks.filter((t) => !isDoneForCurrentPeriod(t));

  const { mustDo, optional } = sortTasksForCategory(activeTasks);
  res.json({ mustDo, optional });
}

async function listSuggestions(req, res) {
  const tasks = await Task.find({});
  const activeTasks = tasks.filter((t) => !isDoneForCurrentPeriod(t));

  const { mustDo, optional } = sortTasksForCategory(activeTasks);
  res.json({ mustDo, optional: optional.slice(0, 5) });
}

async function listCompleted(req, res) {
  const tasks = await Task.find({ lastCompletedDate: { $ne: null } });
  const completedToday = tasks
    .filter((t) => isSameDay(t.lastCompletedDate, new Date()))
    .sort((a, b) => new Date(b.lastCompletedDate) - new Date(a.lastCompletedDate));

  res.json(completedToday);
}

async function createTask(req, res) {
  const task = await Task.create(req.body);
  res.status(201).json(task);
}

async function getTaskDetail(req, res) {
  const task = await Task.findById(req.params.id);
  if (!task) return res.status(404).json({ error: "Task not found" });

  const fact = await getRandomFact();
  res.json({
    task,
    stats: {
      totalCompletions: task.completionHistory.length,
      currentStreak: task.currentStreak,
    },
    fact: fact ? fact.text : null,
    easierTip: getEasierTip(task.estimatedMinutes),
  });
}

async function completeTask(req, res) {
  const task = await Task.findById(req.params.id);
  if (!task) return res.status(404).json({ error: "Task not found" });

  try {
    const update = applyCompletion(task);
    task.currentStreak = update.currentStreak;
    task.completionHistory = update.completionHistory;
    task.lastCompletedDate = update.lastCompletedDate;
    await task.save();
    res.json(task);
  } catch (err) {
    if (err instanceof AlreadyCompletedTodayError || err instanceof AlreadyCompletedError) {
      return res.status(409).json({ error: err.message, task });
    }
    throw err;
  }
}

async function updateTask(req, res) {
  const task = await Task.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });
  if (!task) return res.status(404).json({ error: "Task not found" });
  res.json(task);
}

async function deleteTask(req, res) {
  const task = await Task.findByIdAndDelete(req.params.id);
  if (!task) return res.status(404).json({ error: "Task not found" });
  res.status(204).send();
}

module.exports = {
  listByLength,
  listSuggestions,
  listCompleted,
  createTask,
  getTaskDetail,
  completeTask,
  updateTask,
  deleteTask,
};
