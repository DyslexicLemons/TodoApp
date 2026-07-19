const { startOfWeek, startOfMonth } = require("../../../shared/dateLogic");
const { CATEGORIES } = require("../models/Task");

const WEEKDAY_LABELS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

/** Monday-first weekday index (0=Monday..6=Sunday), matching startOfWeek's internal convention. */
function weekdayIndex(date) {
  return (new Date(date).getDay() + 6) % 7;
}

/** Flattens every task's completionHistory into { date, category } entries, one per completion event. */
function flattenCompletions(tasks) {
  return tasks.flatMap((task) => task.completionHistory.map((date) => ({ date, category: task.category })));
}

function monthLabel(year, month) {
  return new Date(year, month - 1, 1).toLocaleDateString("en-US", { month: "long", year: "numeric" });
}

function zeroFilledCategoryCounts() {
  const counts = {};
  for (const category of CATEGORIES) counts[category] = 0;
  return counts;
}

/** Available months for the dropdown, derived from actual completion data, newest first. Always includes the current month. */
function listAvailableMonths(tasks, now = new Date()) {
  const completions = flattenCompletions(tasks);
  const keys = new Map();

  const addMonth = (date) => {
    const start = startOfMonth(date);
    const key = start.getTime();
    if (!keys.has(key)) {
      const year = start.getFullYear();
      const month = start.getMonth() + 1;
      keys.set(key, { year, month, label: monthLabel(year, month) });
    }
  };

  addMonth(now);
  for (const { date } of completions) addMonth(date);

  return [...keys.entries()].sort((a, b) => b[0] - a[0]).map(([, value]) => value);
}

/** Every Mon-Sun week (as startOfWeek dates) that overlaps the given calendar month, ascending. */
function weeksInMonth(year, month) {
  const monthStart = startOfMonth(new Date(year, month - 1, 1));
  const monthEnd = new Date(year, month, 0); // last day of the month
  const weeks = [];
  let cursor = startOfWeek(monthStart);
  while (cursor <= monthEnd) {
    weeks.push(new Date(cursor));
    cursor = new Date(cursor);
    cursor.setDate(cursor.getDate() + 7);
  }
  return weeks;
}

function weekRangeLabel(weekStart) {
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekEnd.getDate() + 6);
  const fmt = (d) => d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  return `${fmt(weekStart)} – ${fmt(weekEnd)}`;
}

/** Total completions + category counts for a single calendar month (filtered before bucketing). */
function completionsForMonth(completions, year, month) {
  const targetKey = startOfMonth(new Date(year, month - 1, 1)).getTime();
  return completions.filter(({ date }) => startOfMonth(date).getTime() === targetKey);
}

function categoryBreakdownFor(monthCompletions) {
  const counts = zeroFilledCategoryCounts();
  for (const { category } of monthCompletions) counts[category] += 1;
  return CATEGORIES.map((category) => ({ category, count: counts[category] }));
}

function percentChange(previous, current) {
  if (previous === 0) return null;
  return Math.round(((current - previous) / previous) * 100);
}

/** Full monthly dashboard payload: totals, weekly breakdown, category breakdown, and trend vs the previous month. */
function getMonthlyDashboard(tasks, year, month, now = new Date()) {
  const completions = flattenCompletions(tasks);
  const monthCompletions = completionsForMonth(completions, year, month);

  const weekBuckets = new Map(weeksInMonth(year, month).map((weekStart) => [weekStart.getTime(), 0]));
  for (const { date } of monthCompletions) {
    const key = startOfWeek(date).getTime();
    weekBuckets.set(key, (weekBuckets.get(key) || 0) + 1);
  }
  const weeklyBreakdown = [...weekBuckets.entries()]
    .sort((a, b) => a[0] - b[0])
    .map(([key, completionsCount]) => {
      const weekStart = new Date(key);
      return {
        weekStart: weekStart.toISOString().slice(0, 10),
        weekLabel: weekRangeLabel(weekStart),
        completions: completionsCount,
      };
    });

  const categoryBreakdown = categoryBreakdownFor(monthCompletions);

  const prevDate = new Date(year, month - 2, 1);
  const prevYear = prevDate.getFullYear();
  const prevMonth = prevDate.getMonth() + 1;
  const prevCompletions = completionsForMonth(completions, prevYear, prevMonth);
  const prevCategoryBreakdown = categoryBreakdownFor(prevCompletions);

  const trend = {
    totalDelta: monthCompletions.length - prevCompletions.length,
    totalPercentChange: percentChange(prevCompletions.length, monthCompletions.length),
    byCategory: categoryBreakdown.map((entry, i) => {
      const previousCount = prevCategoryBreakdown[i].count;
      return {
        category: entry.category,
        thisMonth: entry.count,
        previousMonth: previousCount,
        delta: entry.count - previousCount,
        percentChange: percentChange(previousCount, entry.count),
      };
    }),
  };

  return {
    year,
    month,
    label: monthLabel(year, month),
    totalCompletions: monthCompletions.length,
    weeklyBreakdown,
    categoryBreakdown,
    previousMonth: { year: prevYear, month: prevMonth, label: monthLabel(prevYear, prevMonth), totalCompletions: prevCompletions.length },
    trend,
  };
}

/** All-time day-of-week x category completion matrix, Monday-first. */
function getWeekdayCategoryMatrix(tasks) {
  const completions = flattenCompletions(tasks);

  const rows = WEEKDAY_LABELS.map((label, weekdayIdx) => ({
    weekday: label,
    weekdayIndex: weekdayIdx,
    categories: zeroFilledCategoryCounts(),
    total: 0,
  }));
  const categoryTotals = zeroFilledCategoryCounts();

  for (const { date, category } of completions) {
    const row = rows[weekdayIndex(date)];
    row.categories[category] += 1;
    row.total += 1;
    categoryTotals[category] += 1;
  }

  return { matrix: rows, categoryTotals, grandTotal: completions.length };
}

module.exports = {
  weekdayIndex,
  flattenCompletions,
  listAvailableMonths,
  getMonthlyDashboard,
  getWeekdayCategoryMatrix,
};
