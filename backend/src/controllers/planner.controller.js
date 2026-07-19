const { Task } = require("../models/Task");
const { Settings } = require("../models/Settings");
const { CalendarConnection } = require("../models/CalendarConnection");
const { startOfDay, startOfWeek } = require("../services/dateUtil");
const { buildWeekPlan } = require("../services/plannerService");
const googleCalendarService = require("../services/googleCalendarService");

const DAY_MS = 24 * 60 * 60 * 1000;

async function getWeekPlan(req, res) {
  const now = new Date();
  const weekStart = req.query.weekStart ? startOfDay(new Date(req.query.weekStart)) : startOfWeek(now);
  const weekEnd = new Date(weekStart.getTime() + 7 * DAY_MS);

  const [settings, connection, tasks] = await Promise.all([
    Settings.getSingleton(),
    CalendarConnection.getSingleton(),
    Task.find({}),
  ]);

  const calendarBusy = connection.connected ? await googleCalendarService.getFreeBusy(weekStart, weekEnd) : [];

  const plan = buildWeekPlan({
    tasks: tasks.map((t) => t.toJSON()),
    workSchedule: settings.workSchedule,
    sleepSchedule: settings.sleepSchedule,
    calendarBusy,
    now,
    weekStart,
  });

  res.json(plan);
}

module.exports = { getWeekPlan };
