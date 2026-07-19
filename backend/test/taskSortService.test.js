const test = require("node:test");
const assert = require("node:assert/strict");
const { compareOptionalTasks, sortTasksForCategory } = require("../src/services/taskSortService");

test("shorter estimated time sorts first", () => {
  const quick = { estimatedMinutes: 15, completionHistory: [], dueDate: null };
  const long = { estimatedMinutes: 240, completionHistory: [], dueDate: null };
  assert.ok(compareOptionalTasks(quick, long) < 0);
});

test("within same estimated time, more completion history sorts first", () => {
  const habitual = { estimatedMinutes: 60, completionHistory: [1, 2, 3], dueDate: null };
  const rare = { estimatedMinutes: 60, completionHistory: [1], dueDate: null };
  assert.ok(compareOptionalTasks(habitual, rare) < 0);
});

test("ties break on soonest due date, nulls last", () => {
  const soon = { estimatedMinutes: 15, completionHistory: [], dueDate: new Date("2026-01-01") };
  const later = { estimatedMinutes: 15, completionHistory: [], dueDate: new Date("2026-06-01") };
  const none = { estimatedMinutes: 15, completionHistory: [], dueDate: null };
  assert.ok(compareOptionalTasks(soon, later) < 0);
  assert.ok(compareOptionalTasks(later, none) < 0);
});

test("sortTasksForCategory pins must-do tasks separately from optional sort", () => {
  const tasks = [
    { isMustDo: true, estimatedMinutes: 240, completionHistory: [], dueDate: null },
    { isMustDo: false, estimatedMinutes: 15, completionHistory: [], dueDate: null },
    { isMustDo: false, estimatedMinutes: 240, completionHistory: [], dueDate: null },
  ];
  const { mustDo, optional } = sortTasksForCategory(tasks);
  assert.equal(mustDo.length, 1);
  assert.equal(optional.length, 2);
  assert.equal(optional[0].estimatedMinutes, 15);
});
