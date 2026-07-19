const test = require("node:test");
const assert = require("node:assert/strict");
const {
  countCompletionsInCurrentPeriod,
  isDoneForCurrentPeriod,
} = require("../src/services/frequencyService");

test("daily task: done for the period once completed today", () => {
  const now = new Date("2024-01-17T18:00:00");
  const task = {
    frequency: "Daily",
    targetCount: 1,
    lastCompletedDate: new Date("2024-01-17T08:00:00"),
    completionHistory: [new Date("2024-01-17T08:00:00")],
  };
  assert.equal(isDoneForCurrentPeriod(task, now), true);
});

test("daily task: not done once a new day starts", () => {
  const now = new Date("2024-01-18T08:00:00");
  const task = {
    frequency: "Daily",
    targetCount: 1,
    lastCompletedDate: new Date("2024-01-17T08:00:00"),
    completionHistory: [new Date("2024-01-17T08:00:00")],
  };
  assert.equal(isDoneForCurrentPeriod(task, now), false);
});

test("weekly task: not done until target count reached this week", () => {
  const now = new Date("2024-01-17T12:00:00"); // Wednesday
  const monday = new Date("2024-01-15T12:00:00");
  const tuesday = new Date("2024-01-16T12:00:00");
  const task = { frequency: "Weekly", targetCount: 3, completionHistory: [monday, tuesday] };
  assert.equal(countCompletionsInCurrentPeriod(task, now), 2);
  assert.equal(isDoneForCurrentPeriod(task, now), false);
});

test("weekly task: done once target count reached this week", () => {
  const now = new Date("2024-01-17T12:00:00");
  const monday = new Date("2024-01-15T12:00:00");
  const tuesday = new Date("2024-01-16T12:00:00");
  const wednesday = new Date("2024-01-17T09:00:00");
  const task = { frequency: "Weekly", targetCount: 3, completionHistory: [monday, tuesday, wednesday] };
  assert.equal(isDoneForCurrentPeriod(task, now), true);
});

test("weekly task: completions from a prior week don't count toward this week", () => {
  const now = new Date("2024-01-17T12:00:00");
  const lastWeek = new Date("2024-01-08T12:00:00");
  const task = { frequency: "Weekly", targetCount: 1, completionHistory: [lastWeek] };
  assert.equal(countCompletionsInCurrentPeriod(task, now), 0);
  assert.equal(isDoneForCurrentPeriod(task, now), false);
});

test("monthly task: done once completed once this month", () => {
  const now = new Date("2024-01-20T12:00:00");
  const earlierThisMonth = new Date("2024-01-03T12:00:00");
  const task = { frequency: "Monthly", targetCount: 1, completionHistory: [earlierThisMonth] };
  assert.equal(isDoneForCurrentPeriod(task, now), true);
});

test("monthly task: not done if last completion was a prior month", () => {
  const now = new Date("2024-02-01T12:00:00");
  const lastMonth = new Date("2024-01-20T12:00:00");
  const task = { frequency: "Monthly", targetCount: 1, completionHistory: [lastMonth] };
  assert.equal(isDoneForCurrentPeriod(task, now), false);
});

test("one-time task: done forever after a single completion", () => {
  const now = new Date("2025-01-01T12:00:00");
  const longAgo = new Date("2020-01-01T12:00:00");
  const task = { frequency: "One-Time", targetCount: 1, completionHistory: [longAgo] };
  assert.equal(isDoneForCurrentPeriod(task, now), true);
});

test("one-time task: not done until first completion", () => {
  const now = new Date("2025-01-01T12:00:00");
  const task = { frequency: "One-Time", targetCount: 1, completionHistory: [] };
  assert.equal(isDoneForCurrentPeriod(task, now), false);
});
