const { startOfDay, startOfWeek, startOfMonth } = require("./dateUtil");
const { isDoneForCurrentPeriod, countCompletionsInCurrentPeriod } = require("./frequencyService");
const { compareOptionalTasks, dueDateValue } = require("./taskSortService");

const DAY_MS = 24 * 60 * 60 * 1000;

function addDays(date, n) {
  const d = new Date(date);
  d.setDate(d.getDate() + n);
  return d;
}

function parseTimeToMinutes(hhmm) {
  const [h, m] = hhmm.split(":").map(Number);
  return h * 60 + m;
}

/** Every daily work-shift block overlapping the week, expressed as absolute [start,end) epoch-ms.
 *  Includes the day before the week starts, since an overnight shift that began the prior day
 *  can still wrap into the first day's early morning. */
function shiftBlocksForWeek(weekStart, workSchedule) {
  const blocks = [];
  for (let offset = -1; offset < 7; offset++) {
    const date = addDays(weekStart, offset);
    const schedule = workSchedule[date.getDay()];
    if (!schedule || !schedule.enabled) continue;

    const startMin = parseTimeToMinutes(schedule.start);
    const endMin = parseTimeToMinutes(schedule.end);
    const blockStart = date.getTime() + startMin * 60000;
    const wraps = endMin <= startMin;
    const blockEnd = wraps ? addDays(date, 1).getTime() + endMin * 60000 : date.getTime() + endMin * 60000;
    blocks.push({ start: blockStart, end: blockEnd });
  }
  return blocks;
}

/** Every daily sleep block overlapping the week, expressed as absolute [start,end) epoch-ms.
 *  Unlike the work shift, sleep hours are the same every day, so there's no per-day schedule to
 *  look up. Includes the day before the week starts, for the same overnight-wrap reason as shifts. */
function sleepBlocksForWeek(weekStart, sleepSchedule) {
  if (!sleepSchedule) return [];

  const startMin = parseTimeToMinutes(sleepSchedule.start);
  const endMin = parseTimeToMinutes(sleepSchedule.end);
  const wraps = endMin <= startMin;

  const blocks = [];
  for (let offset = -1; offset < 7; offset++) {
    const date = addDays(weekStart, offset);
    const blockStart = date.getTime() + startMin * 60000;
    const blockEnd = wraps ? addDays(date, 1).getTime() + endMin * 60000 : date.getTime() + endMin * 60000;
    blocks.push({ start: blockStart, end: blockEnd });
  }
  return blocks;
}

function subtractInterval(freeIntervals, busy) {
  const result = [];
  for (const f of freeIntervals) {
    if (busy.end <= f.start || busy.start >= f.end) {
      result.push(f);
      continue;
    }
    if (busy.start > f.start) result.push({ start: f.start, end: busy.start });
    if (busy.end < f.end) result.push({ start: busy.end, end: f.end });
  }
  return result;
}

/** Free time across the whole week as a flat, non-overlapping list of [start,end) epoch-ms windows:
 *  the full week, minus anything already past `now`, minus work-shift blocks, minus sleep blocks,
 *  minus Calendar busy time. */
function computeFreeWindows({ weekStart, weekEnd, now, workSchedule, sleepSchedule, calendarBusy = [] }) {
  const effectiveStart = Math.max(weekStart.getTime(), now.getTime());
  let free = [{ start: effectiveStart, end: weekEnd.getTime() }].filter((w) => w.end > w.start);

  const busyBlocks = [
    ...shiftBlocksForWeek(weekStart, workSchedule),
    ...sleepBlocksForWeek(weekStart, sleepSchedule),
    ...calendarBusy.map((b) => ({ start: new Date(b.start).getTime(), end: new Date(b.end).getTime() })),
  ];

  for (const busy of busyBlocks) {
    free = subtractInterval(free, busy);
  }

  return free.sort((a, b) => a.start - b.start);
}

/** Slices flat week-wide free windows at midnight boundaries into a Map<dayIndex 0-6, windows[]>. */
function splitWindowsByDay(freeWindows, weekStart) {
  const map = new Map();
  for (let i = 0; i < 7; i++) map.set(i, []);

  const weekStartMs = weekStart.getTime();
  for (const w of freeWindows) {
    let cursor = w.start;
    while (cursor < w.end) {
      const dayIndex = Math.floor((cursor - weekStartMs) / DAY_MS);
      const dayBoundary = weekStartMs + (dayIndex + 1) * DAY_MS;
      const sliceEnd = Math.min(w.end, dayBoundary);
      if (dayIndex >= 0 && dayIndex < 7) {
        map.get(dayIndex).push({ start: cursor, end: sliceEnd });
      }
      cursor = sliceEnd;
    }
  }
  return map;
}

/** Day indices (0=Monday..6=Sunday) that are today or later, i.e. still schedulable this week. */
function remainingDayIndices(weekStart, now) {
  const todayStart = startOfDay(now).getTime();
  const days = [];
  for (let i = 0; i < 7; i++) {
    if (weekStart.getTime() + i * DAY_MS >= todayStart) days.push(i);
  }
  return days;
}

/** Spreads undone Monthly tasks evenly across the weeks remaining in the month:
 *  ceil(N / weeksRemaining) per week, oldest-undone first. Returns an array of buckets,
 *  bucket[0] being this week's share. */
function assignMonthlyTasksToWeeks(monthlyTasks, now = new Date()) {
  const monthStart = startOfMonth(now);
  const nextMonthStart = new Date(monthStart);
  nextMonthStart.setMonth(nextMonthStart.getMonth() + 1);

  const weekStarts = [];
  let cursor = startOfWeek(now);
  while (cursor < nextMonthStart) {
    weekStarts.push(new Date(cursor));
    cursor = addDays(cursor, 7);
  }
  const weeksRemaining = Math.max(1, weekStarts.length);

  const sorted = [...monthlyTasks].sort((a, b) => {
    const aKey = a.lastCompletedDate ? new Date(a.lastCompletedDate).getTime() : new Date(a.createdAt).getTime();
    const bKey = b.lastCompletedDate ? new Date(b.lastCompletedDate).getTime() : new Date(b.createdAt).getTime();
    if (aKey !== bKey) return aKey - bKey;
    return dueDateValue(a) - dueDateValue(b);
  });

  const perWeek = Math.ceil(sorted.length / weeksRemaining);
  const buckets = [];
  for (let i = 0; i < weeksRemaining; i++) buckets.push(sorted.slice(i * perWeek, (i + 1) * perWeek));
  return buckets;
}

/** Builds the list of task-instances that need a slot this week, each with the days it's eligible for. */
function buildWeekCandidates({ tasks, now, weekStart, weekEnd }) {
  const dayIndices = remainingDayIndices(weekStart, now);
  const undone = tasks.filter((t) => !isDoneForCurrentPeriod(t, now));

  const monthlyUndone = undone.filter((t) => t.frequency === "Monthly");
  const [thisWeekMonthly = []] = assignMonthlyTasksToWeeks(monthlyUndone, now);
  const thisWeekMonthlyIds = new Set(thisWeekMonthly.map((t) => t.id));

  const candidates = [];
  for (const task of undone) {
    if (task.frequency === "Daily") {
      for (const day of dayIndices) {
        candidates.push({ task, eligibleDays: [day] });
      }
    } else if (task.frequency === "Weekly") {
      const remaining = Math.max(0, task.targetCount - countCompletionsInCurrentPeriod(task, now));
      for (let i = 0; i < remaining && dayIndices.length > 0; i++) {
        const offset = i % dayIndices.length;
        const rotated = [...dayIndices.slice(offset), ...dayIndices.slice(0, offset)];
        candidates.push({ task, eligibleDays: rotated });
      }
    } else if (task.frequency === "Monthly") {
      if (thisWeekMonthlyIds.has(task.id)) {
        candidates.push({ task, eligibleDays: dayIndices });
      }
    } else if (task.frequency === "One-Time") {
      const dueMs = task.dueDate ? new Date(task.dueDate).getTime() : null;
      const dueThisWeek = dueMs !== null && dueMs >= weekStart.getTime() && dueMs < weekEnd.getTime();
      if (task.isMustDo || dueThisWeek || !task.dueDate) {
        candidates.push({ task, eligibleDays: dayIndices });
      }
    }
  }
  return candidates;
}

/** Orders candidates for first-fit placement: must-do before optional; within each, tasks with a
 *  hard weekly/monthly deadline before Daily tasks (a missed Daily just repeats tomorrow); within
 *  each of those groups, must-do sorts by due date then duration, optional reuses the existing
 *  category-view sort (shortest/most-habitual/soonest-due first). */
function orderCandidates(candidates) {
  const hasDeadline = (c) => c.task.frequency === "Weekly" || c.task.frequency === "Monthly";
  const compareMustDo = (a, b) => {
    const dueDelta = dueDateValue(a.task) - dueDateValue(b.task);
    return dueDelta !== 0 ? dueDelta : a.task.estimatedMinutes - b.task.estimatedMinutes;
  };

  function orderTier(list, comparator) {
    const deadline = list.filter(hasDeadline).sort(comparator);
    const daily = list.filter((c) => !hasDeadline(c)).sort(comparator);
    return [...deadline, ...daily];
  }

  const mustDo = orderTier(
    candidates.filter((c) => c.task.isMustDo),
    compareMustDo
  );
  const optional = orderTier(
    candidates.filter((c) => !c.task.isMustDo),
    (a, b) => compareOptionalTasks(a.task, b.task)
  );

  return [...mustDo, ...optional];
}

/** First-fit bin packing: places each ordered candidate into the earliest eligible day/window with
 *  enough room, shrinking that window. Anything that doesn't fit anywhere is reported unscheduled,
 *  never silently dropped. */
function assignTasksToWindows(orderedCandidates, freeWindowsByDayInput) {
  const freeWindowsByDay = new Map();
  for (const [day, windows] of freeWindowsByDayInput) {
    freeWindowsByDay.set(day, windows.map((w) => ({ ...w })));
  }

  const scheduled = [];
  const unscheduled = [];

  for (const candidate of orderedCandidates) {
    const durationMs = candidate.task.estimatedMinutes * 60000;
    let placed = false;

    for (const day of candidate.eligibleDays) {
      const windows = freeWindowsByDay.get(day);
      if (!windows) continue;
      const idx = windows.findIndex((w) => w.end - w.start >= durationMs);
      if (idx === -1) continue;

      const w = windows[idx];
      const start = w.start;
      const end = start + durationMs;
      scheduled.push({ task: candidate.task, day, start, end });
      if (end < w.end) windows[idx] = { start: end, end: w.end };
      else windows.splice(idx, 1);
      placed = true;
      break;
    }

    if (!placed) {
      unscheduled.push({ task: candidate.task, reason: "No free time window large enough this week" });
    }
  }

  return { scheduled, unscheduled };
}

/** Builds the full week plan: free time (minus work shift, sleep, and Calendar busy time), tasks
 *  assigned into it in priority order, and anything that didn't fit. */
function buildWeekPlan({ tasks, workSchedule, sleepSchedule, calendarBusy = [], now = new Date(), weekStart }) {
  const resolvedWeekStart = weekStart ? startOfDay(weekStart) : startOfWeek(now);
  const weekEnd = addDays(resolvedWeekStart, 7);

  const freeWindows = computeFreeWindows({
    weekStart: resolvedWeekStart,
    weekEnd,
    now,
    workSchedule,
    sleepSchedule,
    calendarBusy,
  });
  const freeWindowsByDay = splitWindowsByDay(freeWindows, resolvedWeekStart);

  const candidates = buildWeekCandidates({ tasks, now, weekStart: resolvedWeekStart, weekEnd });
  const ordered = orderCandidates(candidates);
  const { scheduled, unscheduled } = assignTasksToWindows(ordered, freeWindowsByDay);

  const days = [];
  for (let i = 0; i < 7; i++) {
    const date = addDays(resolvedWeekStart, i);
    const windows = freeWindowsByDay.get(i) || [];
    const freeMinutes = windows.reduce((sum, w) => sum + (w.end - w.start) / 60000, 0);
    days.push({
      date: date.toISOString(),
      isPast: date.getTime() < startOfDay(now).getTime(),
      isToday: date.getTime() === startOfDay(now).getTime(),
      noCapacity: windows.length === 0,
      freeMinutes: Math.round(freeMinutes),
    });
  }

  return {
    weekStart: resolvedWeekStart.toISOString(),
    weekEnd: weekEnd.toISOString(),
    days,
    scheduled: scheduled
      .sort((a, b) => a.start - b.start)
      .map((s) => ({
        taskId: s.task.id,
        title: s.task.title,
        category: s.task.category,
        isMustDo: s.task.isMustDo,
        frequency: s.task.frequency,
        day: s.day,
        start: new Date(s.start).toISOString(),
        end: new Date(s.end).toISOString(),
        estimatedMinutes: s.task.estimatedMinutes,
      })),
    unscheduled: unscheduled.map((u) => ({
      taskId: u.task.id,
      title: u.task.title,
      frequency: u.task.frequency,
      reason: u.reason,
    })),
  };
}

module.exports = {
  parseTimeToMinutes,
  computeFreeWindows,
  splitWindowsByDay,
  assignMonthlyTasksToWeeks,
  buildWeekCandidates,
  orderCandidates,
  assignTasksToWindows,
  buildWeekPlan,
};
