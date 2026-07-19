const { Task } = require("../models/Task");
const { listAvailableMonths, getMonthlyDashboard, getWeekdayCategoryMatrix } = require("../services/historyService");

async function listMonths(req, res) {
  const tasks = await Task.find({}, "category completionHistory");
  res.json({ months: listAvailableMonths(tasks) });
}

async function getMonthly(req, res) {
  const year = Number(req.query.year);
  const month = Number(req.query.month);
  if (!Number.isInteger(year) || !Number.isInteger(month) || month < 1 || month > 12) {
    return res.status(400).json({ error: "year and month (1-12) query params are required" });
  }

  const tasks = await Task.find({}, "category completionHistory");
  res.json(getMonthlyDashboard(tasks, year, month));
}

async function getWeekdayMatrix(req, res) {
  const tasks = await Task.find({}, "category completionHistory");
  res.json(getWeekdayCategoryMatrix(tasks));
}

module.exports = { listMonths, getMonthly, getWeekdayMatrix };
