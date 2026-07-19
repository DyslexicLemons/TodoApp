const { google } = require("googleapis");
const { CalendarConnection } = require("../models/CalendarConnection");

const SCOPES = ["https://www.googleapis.com/auth/calendar.readonly"];

function buildOAuthClient() {
  return new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI
  );
}

function getAuthUrl() {
  const oauth2Client = buildOAuthClient();
  return oauth2Client.generateAuthUrl({
    access_type: "offline",
    prompt: "consent",
    scope: SCOPES,
  });
}

async function exchangeCodeForTokens(code) {
  const oauth2Client = buildOAuthClient();
  const { tokens } = await oauth2Client.getToken(code);

  oauth2Client.setCredentials(tokens);
  let googleAccountEmail = null;
  try {
    const oauth2 = google.oauth2({ auth: oauth2Client, version: "v2" });
    const { data } = await oauth2.userinfo.get();
    googleAccountEmail = data.email || null;
  } catch {
    // Non-essential - the connection still works without a display email.
  }

  await CalendarConnection.findOneAndUpdate(
    { singletonKey: "singleton" },
    {
      $set: {
        connected: true,
        googleAccountEmail,
        accessToken: tokens.access_token || null,
        refreshToken: tokens.refresh_token || null,
        accessTokenExpiresAt: tokens.expiry_date ? new Date(tokens.expiry_date) : null,
        scope: tokens.scope || null,
      },
    },
    { upsert: true }
  );
}

/** Loads the stored connection and returns an OAuth2 client that persists any auto-refreshed
 *  access token back to the CalendarConnection doc, so callers never have to manage expiry. */
async function authorizedClientForConnection(connection) {
  const oauth2Client = buildOAuthClient();
  oauth2Client.setCredentials({
    access_token: connection.accessToken,
    refresh_token: connection.refreshToken,
    expiry_date: connection.accessTokenExpiresAt ? connection.accessTokenExpiresAt.getTime() : null,
  });

  oauth2Client.on("tokens", (tokens) => {
    const update = {};
    if (tokens.access_token) update.accessToken = tokens.access_token;
    if (tokens.refresh_token) update.refreshToken = tokens.refresh_token;
    if (tokens.expiry_date) update.accessTokenExpiresAt = new Date(tokens.expiry_date);
    if (Object.keys(update).length > 0) {
      CalendarConnection.findOneAndUpdate({ singletonKey: "singleton" }, { $set: update }).catch((err) =>
        console.error("Failed to persist refreshed Google Calendar token:", err)
      );
    }
  });

  return oauth2Client;
}

/** Returns merged busy intervals [{start, end}] (ISO strings) for the connected calendar
 *  between timeMin and timeMax. Returns an empty array if no calendar is connected. */
async function getFreeBusy(timeMin, timeMax) {
  const connection = await CalendarConnection.getSingleton();
  if (!connection.connected) return [];

  const oauth2Client = await authorizedClientForConnection(connection);
  const calendar = google.calendar({ version: "v3", auth: oauth2Client });

  const { data } = await calendar.freebusy.query({
    requestBody: {
      timeMin: new Date(timeMin).toISOString(),
      timeMax: new Date(timeMax).toISOString(),
      items: [{ id: connection.calendarId }],
    },
  });

  await CalendarConnection.findOneAndUpdate({ singletonKey: "singleton" }, { $set: { lastSyncedAt: new Date() } });

  const busy = data.calendars?.[connection.calendarId]?.busy || [];
  return busy.map((b) => ({ start: b.start, end: b.end }));
}

async function disconnect() {
  const connection = await CalendarConnection.getSingleton();
  if (connection.refreshToken) {
    try {
      const oauth2Client = buildOAuthClient();
      await oauth2Client.revokeToken(connection.refreshToken);
    } catch (err) {
      console.error("Failed to revoke Google Calendar token (continuing to disconnect locally):", err);
    }
  }

  await CalendarConnection.findOneAndUpdate(
    { singletonKey: "singleton" },
    {
      $set: {
        connected: false,
        googleAccountEmail: null,
        accessToken: null,
        refreshToken: null,
        accessTokenExpiresAt: null,
        scope: null,
        lastSyncedAt: null,
      },
    }
  );
}

module.exports = { getAuthUrl, exchangeCodeForTokens, getFreeBusy, disconnect };
