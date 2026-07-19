const test = require("node:test");
const assert = require("node:assert/strict");
const { applyCompletion, flameTierForStreak, AlreadyCompletedTodayError } = require("../src/services/streakService");

function daysAgo(n, from = new Date()) {
  const d = new Date(from);
  d.setDate(d.getDate() - n);
  return d;
}

test("first ever completion sets streak to 1", () => {
  const task = { lastCompletedDate: null, currentStreak: 0, completionHistory: [] };
  const result = applyCompletion(task);
  assert.equal(result.currentStreak, 1);
  assert.equal(result.completionHistory.length, 1);
});

test("completing on the consecutive day increments streak", () => {
  const task = { lastCompletedDate: daysAgo(1), currentStreak: 3, completionHistory: [daysAgo(1)] };
  const result = applyCompletion(task);
  assert.equal(result.currentStreak, 4);
});

test("completing after a missed day resets streak to 1", () => {
  const task = { lastCompletedDate: daysAgo(3), currentStreak: 5, completionHistory: [daysAgo(3)] };
  const result = applyCompletion(task);
  assert.equal(result.currentStreak, 1);
});

test("completing twice same day throws AlreadyCompletedTodayError", () => {
  const task = { lastCompletedDate: new Date(), currentStreak: 2, completionHistory: [new Date()] };
  assert.throws(() => applyCompletion(task), AlreadyCompletedTodayError);
});

test("flame tier thresholds", () => {
  assert.equal(flameTierForStreak(0), "none");
  assert.equal(flameTierForStreak(1), "small");
  assert.equal(flameTierForStreak(4), "small");
  assert.equal(flameTierForStreak(5), "big");
  assert.equal(flameTierForStreak(9), "big");
  assert.equal(flameTierForStreak(10), "volcano");
  assert.equal(flameTierForStreak(50), "volcano");
});
