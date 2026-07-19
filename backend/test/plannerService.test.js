const test = require("node:test");
const assert = require("node:assert/strict");
const {
  computeFreeWindows,
  splitWindowsByDay,
  assignMonthlyTasksToWeeks,
  buildWeekPlan,
} = require("../src/services/plannerService");

const DAY_MS = 24 * 60 * 60 * 1000;
const HOUR_MS = 60 * 60 * 1000;
const MINUTE_MS = 60 * 1000;

const MONDAY = new Date("2024-01-15T00:00:00");
const weekEndOf = (weekStart) => new Date(weekStart.getTime() + 7 * DAY_MS);

function allDisabledSchedule() {
  return Array.from({ length: 7 }, () => ({ enabled: false, start: "16:00", end: "07:00" }));
}

function baseTask(overrides) {
  return {
    id: "t1",
    title: "Task",
    category: "Health",
    frequency: "Daily",
    targetCount: 1,
    isMustDo: false,
    estimatedMinutes: 30,
    dueDate: null,
    lastCompletedDate: null,
    completionHistory: [],
    createdAt: new Date("2023-01-01T00:00:00"),
    ...overrides,
  };
}

test("computeFreeWindows: no work shift, no calendar busy leaves each day fully free", () => {
  const weekStart = MONDAY;
  const free = computeFreeWindows({
    weekStart,
    weekEnd: weekEndOf(weekStart),
    now: weekStart,
    workSchedule: allDisabledSchedule(),
    calendarBusy: [],
  });
  const byDay = splitWindowsByDay(free, weekStart);
  const monday = byDay.get(0);
  assert.equal(monday.length, 1);
  assert.equal(monday[0].start, weekStart.getTime());
  assert.equal(monday[0].end, weekStart.getTime() + DAY_MS);
});

test("computeFreeWindows: overnight work-shift block removes the correct cross-day slice", () => {
  const weekStart = MONDAY;
  const schedule = allDisabledSchedule();
  schedule[weekStart.getDay()] = { enabled: true, start: "16:00", end: "07:00" }; // Monday, wraps into Tuesday
  const free = computeFreeWindows({
    weekStart,
    weekEnd: weekEndOf(weekStart),
    now: weekStart,
    workSchedule: schedule,
    calendarBusy: [],
  });
  const byDay = splitWindowsByDay(free, weekStart);

  const monday = byDay.get(0);
  assert.equal(monday.length, 1);
  assert.equal(monday[0].start, weekStart.getTime());
  assert.equal(monday[0].end, weekStart.getTime() + 16 * HOUR_MS);

  const tuesday = byDay.get(1);
  assert.equal(tuesday.length, 1);
  assert.equal(tuesday[0].start, weekStart.getTime() + DAY_MS + 7 * HOUR_MS);
  assert.equal(tuesday[0].end, weekStart.getTime() + 2 * DAY_MS);
});

test("computeFreeWindows: a calendar-busy interval splits a window in two", () => {
  const weekStart = MONDAY;
  const busyStart = new Date(weekStart.getTime() + 10 * HOUR_MS);
  const busyEnd = new Date(weekStart.getTime() + 11 * HOUR_MS);
  const free = computeFreeWindows({
    weekStart,
    weekEnd: weekEndOf(weekStart),
    now: weekStart,
    workSchedule: allDisabledSchedule(),
    calendarBusy: [{ start: busyStart, end: busyEnd }],
  });
  const monday = splitWindowsByDay(free, weekStart).get(0);
  assert.equal(monday.length, 2);
  assert.equal(monday[0].end, busyStart.getTime());
  assert.equal(monday[1].start, busyEnd.getTime());
});

test("computeFreeWindows: 'now' mid-afternoon clips today's already-passed portion", () => {
  const weekStart = MONDAY;
  const now = new Date(weekStart.getTime() + 14 * HOUR_MS);
  const free = computeFreeWindows({
    weekStart,
    weekEnd: weekEndOf(weekStart),
    now,
    workSchedule: allDisabledSchedule(),
    calendarBusy: [],
  });
  const monday = splitWindowsByDay(free, weekStart).get(0);
  assert.equal(monday.length, 1);
  assert.equal(monday[0].start, now.getTime());
});

test("computeFreeWindows: a full-day work shift leaves an empty (no-capacity) day", () => {
  const weekStart = MONDAY;
  const schedule = allDisabledSchedule();
  schedule[weekStart.getDay()] = { enabled: true, start: "00:00", end: "00:00" }; // wraps to cover the whole day
  const free = computeFreeWindows({
    weekStart,
    weekEnd: weekEndOf(weekStart),
    now: weekStart,
    workSchedule: schedule,
    calendarBusy: [],
  });
  const monday = splitWindowsByDay(free, weekStart).get(0);
  assert.equal(monday.length, 0);
});

test("assignMonthlyTasksToWeeks: 5 undone tasks over 2 remaining weeks split 3-then-2, oldest first", () => {
  const now = new Date("2024-01-22T09:00:00"); // 3rd Monday of Jan 2024; Jan 22 & Jan 29 remain
  const tasks = ["m1", "m2", "m3", "m4", "m5"].map((id, i) =>
    baseTask({ id, frequency: "Monthly", createdAt: new Date(2023, 0, i + 1) })
  );
  const buckets = assignMonthlyTasksToWeeks(tasks, now);
  assert.equal(buckets.length, 2);
  assert.deepEqual(
    buckets[0].map((t) => t.id),
    ["m1", "m2", "m3"]
  );
  assert.deepEqual(
    buckets[1].map((t) => t.id),
    ["m4", "m5"]
  );
});

test("assignMonthlyTasksToWeeks: last week of the month puts every undone task in that single week", () => {
  const now = new Date("2024-01-29T09:00:00"); // last Monday of Jan 2024
  const tasks = ["m1", "m2", "m3"].map((id, i) =>
    baseTask({ id, frequency: "Monthly", createdAt: new Date(2023, 0, i + 1) })
  );
  const buckets = assignMonthlyTasksToWeeks(tasks, now);
  assert.equal(buckets.length, 1);
  assert.equal(buckets[0].length, 3);
});

test("buildWeekPlan: a must-do task is placed ahead of a shorter optional task", () => {
  const weekStart = MONDAY;
  const tasks = [
    baseTask({ id: "optional-short", title: "Optional Short", isMustDo: false, estimatedMinutes: 10 }),
    baseTask({ id: "mustdo-longer", title: "MustDo Longer", isMustDo: true, estimatedMinutes: 60 }),
  ];
  const plan = buildWeekPlan({ tasks, workSchedule: allDisabledSchedule(), now: weekStart, weekStart });

  const mustDo = plan.scheduled.find((s) => s.taskId === "mustdo-longer" && s.day === 0);
  const optional = plan.scheduled.find((s) => s.taskId === "optional-short" && s.day === 0);
  assert.ok(mustDo && optional);
  assert.ok(new Date(mustDo.start).getTime() < new Date(optional.start).getTime());
});

test("buildWeekPlan: tasks that don't fit anywhere are reported unscheduled, never dropped", () => {
  const weekStart = MONDAY;
  const tasks = [
    baseTask({ id: "small-mustdo", title: "Small", isMustDo: true, frequency: "One-Time", estimatedMinutes: 30 }),
    baseTask({ id: "too-big-1", title: "Too Big 1", frequency: "One-Time", estimatedMinutes: 2000 }),
    baseTask({ id: "too-big-2", title: "Too Big 2", frequency: "One-Time", estimatedMinutes: 2000 }),
  ];
  const plan = buildWeekPlan({ tasks, workSchedule: allDisabledSchedule(), now: weekStart, weekStart });

  assert.ok(plan.scheduled.some((s) => s.taskId === "small-mustdo"));
  const unscheduledIds = plan.unscheduled.map((u) => u.taskId).sort();
  assert.deepEqual(unscheduledIds, ["too-big-1", "too-big-2"]);
  assert.ok(plan.unscheduled.every((u) => typeof u.reason === "string" && u.reason.length > 0));
  assert.equal(plan.scheduled.length + plan.unscheduled.length, tasks.length);
});

test("buildWeekPlan: a Weekly task with targetCount 2, one already done this week, gets exactly one new instance", () => {
  const weekStart = MONDAY;
  const alreadyDone = new Date(weekStart.getTime() + DAY_MS + HOUR_MS); // Tuesday, same week
  const tasks = [
    baseTask({
      id: "weekly1",
      frequency: "Weekly",
      targetCount: 2,
      completionHistory: [alreadyDone],
      estimatedMinutes: 20,
    }),
  ];
  const plan = buildWeekPlan({ tasks, workSchedule: allDisabledSchedule(), now: weekStart, weekStart });
  const instances = plan.scheduled.filter((s) => s.taskId === "weekly1");
  assert.equal(instances.length, 1);
});

test("buildWeekPlan: a Daily task pinned per-day never leaks Monday's instance into Tuesday's slot", () => {
  const weekStart = MONDAY;
  const schedule = allDisabledSchedule();
  // Monday is almost entirely consumed by a shift, leaving only two 5-minute slivers - too small for a 30 min task
  schedule[weekStart.getDay()] = { enabled: true, start: "00:05", end: "23:55" };
  const tasks = [baseTask({ id: "daily1", frequency: "Daily", estimatedMinutes: 30 })];
  const plan = buildWeekPlan({ tasks, workSchedule: schedule, now: weekStart, weekStart });

  assert.ok(!plan.scheduled.some((s) => s.taskId === "daily1" && s.day === 0));
  assert.ok(plan.unscheduled.some((u) => u.taskId === "daily1"));

  const tuesdayInstance = plan.scheduled.find((s) => s.taskId === "daily1" && s.day === 1);
  assert.ok(tuesdayInstance);
  assert.equal(new Date(tuesdayInstance.start).getTime(), weekStart.getTime() + DAY_MS);
});
