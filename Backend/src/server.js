
import app from "./app.js";
import { env } from "./config/env.js";
import {
  connectDatabase,
  disconnectDatabase,
} from "./config/database.js";

let server;
let shuttingDown = false;

async function startServer() {
  try {
    await connectDatabase();

    server = app.listen(env.PORT, () => {
      console.log(`IssueFlow API running on port ${env.PORT}`);
      console.log(`Environment: ${env.NODE_ENV}`);
    });

    server.on("error", (error) => {
      console.error("HTTP server error:", error.message);
      process.exitCode = 1;
    });
  } catch (error) {
    console.error("Failed to start IssueFlow:", error.message);
    process.exitCode = 1;
  }
}

async function shutdown(signal) {
  if (shuttingDown) return;
  shuttingDown = true;

  console.log(`${signal} received. Shutting down IssueFlow...`);

  try {
    if (server) {
      await new Promise((resolve, reject) => {
        server.close((error) => {
          if (error) reject(error);
          else resolve();
        });
      });
    }

    await disconnectDatabase();
    console.log("IssueFlow shut down successfully.");
    process.exitCode = 0;
  } catch (error) {
    console.error("Shutdown failed:", error.message);
    process.exitCode = 1;
  }
}

process.once("SIGINT", () => void shutdown("SIGINT"));
process.once("SIGTERM", () => void shutdown("SIGTERM"));

await startServer();
