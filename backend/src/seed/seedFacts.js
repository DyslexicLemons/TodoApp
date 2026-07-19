const { Fact } = require("../models/Fact");
const factsSeed = require("./facts.seed.json");

async function seedFacts() {
  const count = await Fact.countDocuments();
  if (count > 0) {
    console.log(`Facts already present (${count}), skipping seed.`);
    return;
  }
  await Fact.insertMany(factsSeed);
  console.log(`Seeded ${factsSeed.length} facts.`);
}

module.exports = { seedFacts };
