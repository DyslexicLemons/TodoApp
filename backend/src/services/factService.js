const { Fact } = require("../models/Fact");

async function getRandomFact() {
  const [fact] = await Fact.aggregate([{ $sample: { size: 1 } }]);
  return fact || null;
}

const CATEGORY_GOALS = {
  Health: "Keep your body and mind running well enough to do everything else.",
  "Working Skills": "Get sharper and more capable at the work that pays the bills.",
  "Personal Skills": "Grow into someone more capable, one small skill at a time.",
  Housework: "Keep your space livable so it stops draining your attention.",
  Social: "Keep the people who matter to you close.",
  "Self-Expression": "Make something that's actually yours.",
};

const CATEGORY_REASONS = {
  Health: "Neglecting this compounds into problems that are much harder to fix later.",
  "Working Skills": "Skills like this rarely improve on their own - they need deliberate reps.",
  "Personal Skills": "Small, consistent practice here is what turns into real ability.",
  Housework: "A cluttered environment quietly taxes your focus and mood every day.",
  Social: "Relationships fade without upkeep, even when nothing's wrong.",
  "Self-Expression": "Without an outlet for this, it tends to leak out sideways as stress.",
};

function getTaskGoal(category) {
  return CATEGORY_GOALS[category] || "Make steady progress on something that matters to you.";
}

function getTaskWhy(category) {
  return CATEGORY_REASONS[category] || "Consistent effort here adds up more than it seems to in the moment.";
}

module.exports = { getRandomFact, getTaskGoal, getTaskWhy };
