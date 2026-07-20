const mongoose = require("mongoose");

const daySchema = new mongoose.Schema(
  {
    enabled: { type: Boolean, default: true },
    start: { type: String, default: "16:00" },
    end: { type: String, default: "07:00" },
  },
  { _id: false }
);

const sleepScheduleSchema = new mongoose.Schema(
  {
    start: { type: String, default: "08:00" },
    end: { type: String, default: "15:00" },
  },
  { _id: false }
);

const settingsSchema = new mongoose.Schema(
  {
    singletonKey: { type: String, default: "singleton", unique: true },
    // indexed 0 = Sunday .. 6 = Saturday (matches Date#getDay()); end < start means the shift wraps past midnight
    workSchedule: { type: [daySchema], default: () => Array.from({ length: 7 }, () => ({})) },
    // Same every day, unlike workSchedule - end < start means it wraps past midnight
    sleepSchedule: { type: sleepScheduleSchema, default: () => ({}) },
    // IANA name (e.g. "America/New_York"). All work/sleep-schedule HH:MM strings, and every other
    // date computation in the app (streaks, due dates, the planner's day boundaries), are
    // interpreted in this timezone - see seedSettings.js, which applies it to process.env.TZ.
    timezone: { type: String, default: () => process.env.TZ || "UTC" },
  },
  { timestamps: true }
);

settingsSchema.set("toJSON", {
  transform: (_doc, ret) => {
    ret.id = ret._id;
    delete ret._id;
    delete ret.__v;
    delete ret.singletonKey;
  },
});

settingsSchema.statics.getSingleton = async function () {
  return this.findOneAndUpdate({ singletonKey: "singleton" }, {}, { new: true, upsert: true });
};

const Settings = mongoose.model("Settings", settingsSchema);

module.exports = { Settings };
