const TIME_BUCKETS = [
  { length: "Quick", maxMinutes: 30 },
  { length: "Small", maxMinutes: 120 },
  { length: "Medium", maxMinutes: 300 },
  { length: "Long-Term", maxMinutes: Infinity },
];

const LENGTHS = TIME_BUCKETS.map((b) => b.length);

function lengthForMinutes(minutes) {
  const bucket = TIME_BUCKETS.find((b) => minutes <= b.maxMinutes);
  return (bucket || TIME_BUCKETS[TIME_BUCKETS.length - 1]).length;
}

function minutesRangeForLength(length) {
  const idx = TIME_BUCKETS.findIndex((b) => b.length === length);
  if (idx === -1) return null;
  const min = idx === 0 ? 0 : TIME_BUCKETS[idx - 1].maxMinutes;
  return { min, max: TIME_BUCKETS[idx].maxMinutes };
}

function formatEstimatedTime(minutes) {
  if (minutes < 30) return "<30 min";
  if (minutes < 60) return `~${Math.round(minutes / 15) * 15} min`;
  const hours = Math.round((minutes / 60) * 2) / 2;
  return `~${hours} hour${hours === 1 ? "" : "s"}`;
}

module.exports = { TIME_BUCKETS, LENGTHS, lengthForMinutes, minutesRangeForLength, formatEstimatedTime };
