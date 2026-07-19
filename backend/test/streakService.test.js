const test = require("node:test");
const assert = require("node:assert/strict");
const {
  applyCompletion,
  flameTierForStreak,
  AlreadyCompletedTodayError,
  AlreadyCompletedError,
} = require("../src/services/streakService");

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

test("weekly task: streak stays unchanged until target reached", () => {
  const now = new Date("2024-01-17T12:00:00"); // Wednesday
  const monday = new Date("2024-01-15T12:00:00");
  const task = {
    frequency: "Weekly",
    targetCount: 3,
    currentStreak: 0,
    lastCompletedDate: monday,
    completionHistory: [monday],
  };
  const result = applyCompletion(task, now);
  assert.equal(result.currentStreak, 0);
});

test("weekly task: hitting target for the first time sets streak to 1", () => {
  const now = new Date("2024-01-17T12:00:00"); // Wednesday
  const monday = new Date("2024-01-15T12:00:00");
  const tuesday = new Date("2024-01-16T12:00:00");
  const task = {
    frequency: "Weekly",
    targetCount: 3,
    currentStreak: 0,
    lastCompletedDate: tuesday,
    completionHistory: [monday, tuesday],
  };
  const result = applyCompletion(task, now);
  assert.equal(result.currentStreak, 1);
});

test("weekly task: hitting target in the immediately following week increments streak", () => {
  const now = new Date("2024-01-17T12:00:00");
  const lastWeek = new Date("2024-01-10T12:00:00"); // exactly 7 days earlier
  const task = {
    frequency: "Weekly",
    targetCount: 1,
    currentStreak: 2,
    lastCompletedDate: lastWeek,
    completionHistory: [lastWeek],
  };
  const result = applyCompletion(task, now);
  assert.equal(result.currentStreak, 3);
});

test("weekly task: skipping a week resets streak to 1", () => {
  const now = new Date("2024-01-24T12:00:00");
  const twoWeeksAgo = new Date("2024-01-10T12:00:00");
  const task = {
    frequency: "Weekly",
    targetCount: 1,
    currentStreak: 5,
    lastCompletedDate: twoWeeksAgo,
    completionHistory: [twoWeeksAgo],
  };
  const result = applyCompletion(task, now);
  assert.equal(result.currentStreak, 1);
});

test("monthly task: hitting target in the immediately following month increments streak", () => {
  const now = new Date("2024-02-15T12:00:00");
  const lastMonth = new Date("2024-01-10T12:00:00");
  const task = {
    frequency: "Monthly",
    targetCount: 1,
    currentStreak: 4,
    lastCompletedDate: lastMonth,
    completionHistory: [lastMonth],
  };
  const result = applyCompletion(task, now);
  assert.equal(result.currentStreak, 5);
});

test("monthly task: skipping a month resets streak to 1", () => {
  const now = new Date("2024-03-15T12:00:00");
  const twoMonthsAgo = new Date("2024-01-10T12:00:00");
  const task = {
    frequency: "Monthly",
    targetCount: 1,
    currentStreak: 4,
    lastCompletedDate: twoMonthsAgo,
    completionHistory: [twoMonthsAgo],
  };
  const result = applyCompletion(task, now);
  assert.equal(result.currentStreak, 1);
});

test("one-time task: first completion sets streak to 1", () => {
  const task = { frequency: "One-Time", currentStreak: 0, lastCompletedDate: null, completionHistory: [] };
  const result = applyCompletion(task);
  assert.equal(result.currentStreak, 1);
});

test("one-time task: completing again ever throws AlreadyCompletedError", () => {
  const past = daysAgo(30);
  const task = { frequency: "One-Time", currentStreak: 1, lastCompletedDate: past, completionHistory: [past] };
  assert.throws(() => applyCompletion(task), AlreadyCompletedError);
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
