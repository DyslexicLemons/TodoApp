const express = require("express");
const cors = require("cors");
const tasksRoutes = require("./routes/tasks.routes");
const factsRoutes = require("./routes/facts.routes");
const historyRoutes = require("./routes/history.routes");

function createApp() {
  const app = express();

  app.use(cors());
  app.use(express.json());

  app.use("/api/tasks", tasksRoutes);
  app.use("/api/facts", factsRoutes);
  app.use("/api/history", historyRoutes);

  app.get("/api/health", (_req, res) => res.json({ status: "ok" }));

  app.use((err, _req, res, _next) => {
    if (err.name === "ValidationError" || err.name === "CastError") {
      return res.status(400).json({ error: err.message });
    }
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  });

  return app;
}

module.exports = { createApp };
