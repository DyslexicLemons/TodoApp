const { Settings } = require("../models/Settings");

async function getSettings(req, res) {
  const settings = await Settings.getSingleton();
  res.json(settings);
}

async function updateSettings(req, res) {
  const update = {};
  if (req.body.workSchedule !== undefined) update.workSchedule = req.body.workSchedule;
  if (req.body.sleepSchedule !== undefined) update.sleepSchedule = req.body.sleepSchedule;

  const settings = await Settings.findOneAndUpdate({ singletonKey: "singleton" }, update, {
    new: true,
    upsert: true,
    runValidators: true,
  });
  res.json(settings);
}

module.exports = { getSettings, updateSettings };
