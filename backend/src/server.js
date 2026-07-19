const { createApp } = require("./app");
const { connectDB } = require("./config/db");
const { seedFacts } = require("./seed/seedFacts");

async function main() {
  await connectDB();
  await seedFacts();

  const app = createApp();
  const port = process.env.PORT || 4000;
  app.listen(port, () => console.log(`Backend listening on port ${port}`));
}

main().catch((err) => {
  console.error("Failed to start server:", err);
  process.exit(1);
});
