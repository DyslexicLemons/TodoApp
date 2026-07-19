const test = require("node:test");
const assert = require("node:assert/strict");
const {
  weekdayIndex,
  listAvailableMonths,
  getMonthlyDashboard,
  getWeekdayCategoryMatrix,
} = require("../src/services/historyService");

function task(category, ...isoDates) {
  return { category, completionHistory: isoDates.map((d) => new Date(d)) };
}

test("listAvailableMonths always includes the current month even with no completions", () => {
  const now = new Date("2026-07-19T12:00:00");
  const months = listAvailableMonths([task("Health")], now);
  assert.ok(months.some((m) => m.year === 2026 && m.month === 7));
});

test("listAvailableMonths dedupes across tasks and sorts descending", () => {
  const now = new Date("2026-07-19T12:00:00");
  const tasks = [
    task("Health", "2026-05-10T09:00:00", "2026-05-20T09:00:00"),
    task("Housework", "2026-05-15T09:00:00", "2026-03-01T09:00:00"),
  ];
  const months = listAvailableMonths(tasks, now);
  const keys = months.map((m) => `${m.year}-${m.month}`);
  assert.deepEqual(keys, ["2026-7", "2026-5", "2026-3"]);
});

test("getMonthlyDashboard for a month with zero completions is fully zero-filled, not sparse", () => {
  const tasks = [task("Health", "2026-05-10T09:00:00")];
  const result = getMonthlyDashboard(tasks, 2026, 7);

  assert.equal(result.totalCompletions, 0);
  assert.equal(result.categoryBreakdown.length, 6);
  assert.ok(result.categoryBreakdown.every((c) => c.count === 0));
  assert.ok(result.weeklyBreakdown.length > 0);
  assert.ok(result.weeklyBreakdown.every((w) => w.completions === 0));
});

test("getMonthlyDashboard does not leak a previous-month completion into this month's weekly breakdown, even in the same Mon-Sun week", () => {
  // Jun 29 2026 (Mon) - Jul 5 2026 (Sun) is one week straddling the month boundary.
  const tasks = [task("Health", "2026-06-30T09:00:00", "2026-07-02T09:00:00")];
  const result = getMonthlyDashboard(tasks, 2026, 7);

  assert.equal(result.totalCompletions, 1);
  const straddlingWeek = result.weeklyBreakdown.find((w) => w.weekStart === "2026-06-29");
  assert.ok(straddlingWeek);
  assert.equal(straddlingWeek.completions, 1);
});

test("getMonthlyDashboard trend reports null percentChange (not Infinity/NaN) when previous month had zero completions", () => {
  const tasks = [task("Health", "2026-07-05T09:00:00")];
  const result = getMonthlyDashboard(tasks, 2026, 7);

  assert.equal(result.previousMonth.totalCompletions, 0);
  assert.equal(result.trend.totalPercentChange, null);
  assert.equal(result.trend.totalDelta, 1);
});

test("getMonthlyDashboard trend computes delta/percentChange correctly for a normal case", () => {
  const tasks = [
    task("Health", "2026-06-01T09:00:00", "2026-06-02T09:00:00", "2026-07-01T09:00:00", "2026-07-02T09:00:00"),
  ];
  const result = getMonthlyDashboard(tasks, 2026, 7);

  assert.equal(result.totalCompletions, 2);
  assert.equal(result.previousMonth.totalCompletions, 2);
  assert.equal(result.trend.totalDelta, 0);
  assert.equal(result.trend.totalPercentChange, 0);

  const health = result.trend.byCategory.find((c) => c.category === "Health");
  assert.equal(health.thisMonth, 2);
  assert.equal(health.previousMonth, 2);
  assert.equal(health.delta, 0);
});

test("getWeekdayCategoryMatrix zero-fills categories with no completions ever", () => {
  const tasks = [task("Health", "2026-07-06T09:00:00")]; // a Monday
  const result = getWeekdayCategoryMatrix(tasks);

  assert.equal(result.categoryTotals["Personal Skills"], 0);
  const monday = result.matrix.find((r) => r.weekday === "Monday");
  assert.equal(monday.categories["Personal Skills"], 0);
  assert.equal(monday.categories["Health"], 1);
});

test("getWeekdayCategoryMatrix: a Sunday completion lands in weekdayIndex 6 (Monday-first convention)", () => {
  const tasks = [task("Social", "2026-07-12T09:00:00")]; // a Sunday
  const result = getWeekdayCategoryMatrix(tasks);

  const sundayRow = result.matrix.find((r) => r.weekdayIndex === 6);
  assert.equal(sundayRow.weekday, "Sunday");
  assert.equal(sundayRow.categories["Social"], 1);
  assert.equal(weekdayIndex("2026-07-12T09:00:00"), 6);
});
