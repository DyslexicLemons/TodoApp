const { Fact } = require("../models/Fact");

async function getRandomFact() {
  const [fact] = await Fact.aggregate([{ $sample: { size: 1 } }]);
  return fact || null;
}

const EASIER_TIPS = {
  Easy: "Just start - this one is small enough to finish in one sitting.",
  Medium: "Break it into 2-3 sub-steps and knock out the first one now.",
  Hard: "Commit to just 10 minutes on it. Momentum does the rest.",
};

function getEasierTip(difficulty) {
  return EASIER_TIPS[difficulty] || EASIER_TIPS.Medium;
}

module.exports = { getRandomFact, getEasierTip };
