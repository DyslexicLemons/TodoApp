const { CalendarConnection } = require("../models/CalendarConnection");
const googleCalendarService = require("../services/googleCalendarService");

async function getStatus(req, res) {
  const connection = await CalendarConnection.getSingleton();
  res.json(connection);
}

async function getAuthUrl(req, res) {
  res.json({ url: googleCalendarService.getAuthUrl() });
}

async function handleCallback(req, res) {
  const { code } = req.query;
  if (!code) return res.status(400).json({ error: "Missing code" });

  await googleCalendarService.exchangeCodeForTokens(code);
  res.redirect(`${process.env.FRONTEND_URL}/settings?calendarConnected=1`);
}

async function disconnect(req, res) {
  await googleCalendarService.disconnect();
  res.json({ connected: false });
}

module.exports = { getStatus, getAuthUrl, handleCallback, disconnect };
