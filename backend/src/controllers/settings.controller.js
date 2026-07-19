const { Settings } = require("../models/Settings");

async function getSettings(req, res) {
  const settings = await Settings.getSingleton();
  res.json(settings);
}

async function updateSettings(req, res) {
  const settings = await Settings.findOneAndUpdate(
    { singletonKey: "singleton" },
    { workSchedule: req.body.workSchedule },
    { new: true, upsert: true, runValidators: true }
  );
  res.json(settings);
}

module.exports = { getSettings, updateSettings };
