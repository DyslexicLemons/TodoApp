const mongoose = require("mongoose");

const calendarConnectionSchema = new mongoose.Schema(
  {
    singletonKey: { type: String, default: "singleton", unique: true },
    connected: { type: Boolean, default: false },
    googleAccountEmail: { type: String, default: null },
    accessToken: { type: String, default: null },
    refreshToken: { type: String, default: null },
    accessTokenExpiresAt: { type: Date, default: null },
    scope: { type: String, default: null },
    calendarId: { type: String, default: "primary" },
    lastSyncedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

// Tokens are sensitive and never belong in an API response - only status fields do.
calendarConnectionSchema.set("toJSON", {
  transform: (_doc, ret) => ({
    id: ret._id,
    connected: ret.connected,
    googleAccountEmail: ret.googleAccountEmail,
    lastSyncedAt: ret.lastSyncedAt,
  }),
});

calendarConnectionSchema.statics.getSingleton = async function () {
  return this.findOneAndUpdate({ singletonKey: "singleton" }, {}, { new: true, upsert: true });
};

const CalendarConnection = mongoose.model("CalendarConnection", calendarConnectionSchema);

module.exports = { CalendarConnection };
