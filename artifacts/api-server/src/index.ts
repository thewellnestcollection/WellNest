import app from "./app";
import { logger } from "./lib/logger";
import { db, propertiesTable } from "@workspace/db";
import { count } from "drizzle-orm";
import { SEED_PROPERTIES } from "@workspace/db/src/seed-data";

const rawPort = process.env["PORT"];

if (!rawPort) {
  throw new Error(
    "PORT environment variable is required but was not provided.",
  );
}

const port = Number(rawPort);

if (Number.isNaN(port) || port <= 0) {
  throw new Error(`Invalid PORT value: "${rawPort}"`);
}

async function seedIfEmpty() {
  try {
    const [{ value }] = await db.select({ value: count() }).from(propertiesTable);
    if (value === 0) {
      logger.info("Database is empty — seeding properties...");
      await db.insert(propertiesTable).values(SEED_PROPERTIES);
      logger.info({ count: SEED_PROPERTIES.length }, "Seed complete");
    } else {
      logger.info({ count: value }, "Database already has properties, skipping seed");
    }
  } catch (err) {
    logger.error({ err }, "Seed check failed — continuing anyway");
  }
}

app.listen(port, async (err) => {
  if (err) {
    logger.error({ err }, "Error listening on port");
    process.exit(1);
  }

  logger.info({ port }, "Server listening");
  await seedIfEmpty();
});
