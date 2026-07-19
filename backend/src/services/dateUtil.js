const { startOfDay, startOfWeek, startOfMonth } = require("../../../shared/dateLogic");

function daysBetween(a, b) {
  const MS_PER_DAY = 24 * 60 * 60 * 1000;
  return Math.round((startOfDay(b).getTime() - startOfDay(a).getTime()) / MS_PER_DAY);
}

function isSameDay(a, b) {
  return daysBetween(a, b) === 0;
}

module.exports = { startOfDay, daysBetween, isSameDay, startOfWeek, startOfMonth };
