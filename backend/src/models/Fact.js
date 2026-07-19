const mongoose = require("mongoose");

const factSchema = new mongoose.Schema({
  text: { type: String, required: true },
  tags: { type: [String], default: [] },
});

const Fact = mongoose.model("Fact", factSchema);

module.exports = { Fact };
