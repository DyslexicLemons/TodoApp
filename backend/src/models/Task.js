const mongoose = require("mongoose");

const DIFFICULTIES = ["Easy", "Medium", "Hard"];
const LENGTHS = ["Quick", "Small", "Medium", "Long-Term"];
const CATEGORIES = ["Health", "Working Skills", "Personal Skills", "Housework", "Social", "Self-Expression"];

const taskSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, default: "" },
    dueDate: { type: Date, default: null },
    difficulty: { type: String, enum: DIFFICULTIES, required: true },
    length: { type: String, enum: LENGTHS, required: true },
    category: { type: String, enum: CATEGORIES, required: true },
    isMustDo: { type: Boolean, required: true, default: false },
    currentStreak: { type: Number, default: 0 },
    completionHistory: { type: [Date], default: [] },
    lastCompletedDate: { type: Date, default: null },
  },
  { timestamps: true }
);

taskSchema.set("toJSON", {
  virtuals: true,
  transform: (_doc, ret) => {
    ret.id = ret._id;
    delete ret._id;
    delete ret.__v;
  },
});

const Task = mongoose.model("Task", taskSchema);

module.exports = { Task, DIFFICULTIES, LENGTHS, CATEGORIES };
