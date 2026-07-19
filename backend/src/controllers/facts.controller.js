const { getRandomFact } = require("../services/factService");

async function randomFact(req, res) {
  const fact = await getRandomFact();
  if (!fact) return res.status(404).json({ error: "No facts available" });
  res.json(fact);
}

module.exports = { randomFact };
