import "dotenv/config";
import { connectDatabase, getDatabase } from "./database/client.js";

async function main() {
  try {
    await connectDatabase();
    const database = getDatabase();
    console.log(`MongoDB connected successfully: ${database.databaseName}`);
    process.exit(0);
  } catch (error) {
    console.error(`MongoDB connection check failed: ${error.message || error}`);
    process.exit(1);
  }
}

main();
