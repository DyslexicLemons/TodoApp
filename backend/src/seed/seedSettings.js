const { Settings } = require("../models/Settings");
const { CalendarConnection } = require("../models/CalendarConnection");

async function seedSettings() {
  await Settings.getSingleton();
  await CalendarConnection.getSingleton();
}

module.exports = { seedSettings };
