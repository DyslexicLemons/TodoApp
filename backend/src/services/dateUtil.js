function startOfDay(date) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

function daysBetween(a, b) {
  const MS_PER_DAY = 24 * 60 * 60 * 1000;
  return Math.round((startOfDay(b).getTime() - startOfDay(a).getTime()) / MS_PER_DAY);
}

function isSameDay(a, b) {
  return daysBetween(a, b) === 0;
}

/** Monday-based start of the week containing `date`, local time. */
function startOfWeek(date) {
  const d = startOfDay(date);
  const day = d.getDay(); // 0 = Sunday .. 6 = Saturday
  const diffToMonday = (day + 6) % 7;
  d.setDate(d.getDate() - diffToMonday);
  return d;
}

function startOfMonth(date) {
  const d = startOfDay(date);
  d.setDate(1);
  return d;
}

module.exports = { startOfDay, daysBetween, isSameDay, startOfWeek, startOfMonth };
