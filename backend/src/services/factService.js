const { Fact } = require("../models/Fact");

async function getRandomFact() {
  const [fact] = await Fact.aggregate([{ $sample: { size: 1 } }]);
  return fact || null;
}

const EASIER_TIPS = {
  short: "Just start - this one is small enough to finish in one sitting.",
  medium: "Break it into 2-3 sub-steps and knock out the first one now.",
  long: "Commit to just 10 minutes on it. Momentum does the rest.",
};

function getEasierTip(minutes) {
  if (minutes <= 30) return EASIER_TIPS.short;
  if (minutes <= 120) return EASIER_TIPS.medium;
  return EASIER_TIPS.long;
}

module.exports = { getRandomFact, getEasierTip };
