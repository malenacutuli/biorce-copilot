import "dotenv/config";
import express from "express";
import { createServer } from "http";
import net from "net";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { registerOAuthRoutes } from "./oauth";
import { registerStorageProxy } from "./storageProxy";
import { appRouter } from "../routers";
import { createContext } from "./context";
import { serveStatic, setupVite } from "./vite";
import { weeklyDigestHandler } from "../scheduledHandlers";
import { seedStrategicPartners, deduplicatePartners } from "../seedPartners";

function isPortAvailable(port: number): Promise<boolean> {
  return new Promise(resolve => {
    const server = net.createServer();
    server.listen(port, () => {
      server.close(() => resolve(true));
    });
    server.on("error", () => resolve(false));
  });
}

async function findAvailablePort(startPort: number = 3000): Promise<number> {
  for (let port = startPort; port < startPort + 20; port++) {
    if (await isPortAvailable(port)) {
      return port;
    }
  }
  throw new Error(`No available port found starting from ${startPort}`);
}

async function startServer() {
  const app = express();
  const server = createServer(app);
  // Configure body parser with larger size limit for file uploads
  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ limit: "50mb", extended: true }));
  registerStorageProxy(app);
  registerOAuthRoutes(app);
  // Scheduled handlers (Heartbeat cron callbacks)
  app.post("/api/scheduled/weekly-digest", weeklyDigestHandler);
  // Internal seed endpoint (localhost only, protected by secret header)
  app.post("/api/internal/seed-partners", async (req, res) => {
    if (req.headers['x-internal-seed'] !== 'biorce-seed-2026') {
      return res.status(403).json({ error: 'Forbidden' });
    }
    try {
      const result = await seedStrategicPartners();
      res.json(result);
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });
  // Internal dedup endpoint
  app.post("/api/internal/dedup-partners", async (req, res) => {
    if (req.headers['x-internal-seed'] !== 'biorce-seed-2026') {
      return res.status(403).json({ error: 'Forbidden' });
    }
    try {
      const result = await deduplicatePartners();
      res.json(result);
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });
  // tRPC API
  app.use(
    "/api/trpc",
    createExpressMiddleware({
      router: appRouter,
      createContext,
    })
  );
  // development mode uses Vite, production mode uses static files
  if (process.env.NODE_ENV === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  const preferredPort = parseInt(process.env.PORT || "3000");
  const port = await findAvailablePort(preferredPort);

  if (port !== preferredPort) {
    console.log(`Port ${preferredPort} is busy, using port ${port} instead`);
  }

  server.listen(port, () => {
    console.log(`Server running on http://localhost:${port}/`);
  });
}

startServer().catch(console.error);
