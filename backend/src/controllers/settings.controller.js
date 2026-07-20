const { Settings } = require("../models/Settings");

async function getSettings(req, res) {
  const settings = await Settings.getSingleton();
  res.json(settings);
}

async function updateSettings(req, res) {
  const update = {};
  if (req.body.workSchedule !== undefined) update.workSchedule = req.body.workSchedule;
  if (req.body.sleepSchedule !== undefined) update.sleepSchedule = req.body.sleepSchedule;
  if (req.body.timezone !== undefined) update.timezone = req.body.timezone;

  const settings = await Settings.findOneAndUpdate({ singletonKey: "singleton" }, { $set: update }, {
    new: true,
    upsert: true,
    runValidators: true,
  });
  if (update.timezone) process.env.TZ = update.timezone;
  res.json(settings);
}

module.exports = { getSettings, updateSettings };
