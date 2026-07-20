const { Settings } = require("../models/Settings");
const { CalendarConnection } = require("../models/CalendarConnection");

async function seedSettings() {
  const settings = await Settings.getSingleton();
  await CalendarConnection.getSingleton();
  // Native Date methods (getHours, setHours, getDay, ...) consult process.env.TZ on every call,
  // so this makes the whole app's date arithmetic follow the user's chosen timezone rather than
  // the container's default.
  process.env.TZ = settings.timezone || "UTC";
}

module.exports = { seedSettings };
