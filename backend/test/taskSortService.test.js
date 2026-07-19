const test = require("node:test");
const assert = require("node:assert/strict");
const { compareOptionalTasks, sortTasksForCategory } = require("../src/services/taskSortService");

test("easier difficulty sorts first", () => {
  const easy = { difficulty: "Easy", completionHistory: [], dueDate: null };
  const hard = { difficulty: "Hard", completionHistory: [], dueDate: null };
  assert.ok(compareOptionalTasks(easy, hard) < 0);
});

test("within same difficulty, more completion history sorts first", () => {
  const habitual = { difficulty: "Medium", completionHistory: [1, 2, 3], dueDate: null };
  const rare = { difficulty: "Medium", completionHistory: [1], dueDate: null };
  assert.ok(compareOptionalTasks(habitual, rare) < 0);
});

test("ties break on soonest due date, nulls last", () => {
  const soon = { difficulty: "Easy", completionHistory: [], dueDate: new Date("2026-01-01") };
  const later = { difficulty: "Easy", completionHistory: [], dueDate: new Date("2026-06-01") };
  const none = { difficulty: "Easy", completionHistory: [], dueDate: null };
  assert.ok(compareOptionalTasks(soon, later) < 0);
  assert.ok(compareOptionalTasks(later, none) < 0);
});

test("sortTasksForCategory pins must-do tasks separately from optional sort", () => {
  const tasks = [
    { isMustDo: true, difficulty: "Hard", completionHistory: [], dueDate: null },
    { isMustDo: false, difficulty: "Easy", completionHistory: [], dueDate: null },
    { isMustDo: false, difficulty: "Hard", completionHistory: [], dueDate: null },
  ];
  const { mustDo, optional } = sortTasksForCategory(tasks);
  assert.equal(mustDo.length, 1);
  assert.equal(optional.length, 2);
  assert.equal(optional[0].difficulty, "Easy");
});
