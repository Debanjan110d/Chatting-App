import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import { connectDB } from './config/mongodb';
import cors from 'cors';
import { Message } from './config/mongodb';

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Connect to MongoDB
connectDB();

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }
  });

  next();
});

(async () => {
  const server = await registerRoutes(app);

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";
    res.status(status).json({ message });
    // don't rethrow to avoid crashing the server
  });

  // importantly only setup vite in development and after
  // setting up all the other routes so the catch-all route
  // doesn't interfere with the other routes
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  // ALWAYS serve the app on port 5000
  // this serves both the API and the client.
  // It is the only port that is not firewalled.
  const port = 5000;
  // On Windows, reusePort is unsupported. Use default listen parameters.
  server.listen(port, '0.0.0.0', () => {
    log(`serving on port ${port}`);
  });

  // Cleanup job: remove heavy media older than 24h, text messages older than 7 days
  setInterval(async () => {
    const now = new Date();
    const mediaCutoff = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const textCutoff = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    try {
      await Message.deleteMany({ mediaUrl: { $exists: true }, createdAt: { $lt: mediaCutoff } });
      await Message.deleteMany({ mediaUrl: { $exists: false }, createdAt: { $lt: textCutoff } });
      log('Cleanup job completed');
    } catch (err) {
      console.error('Cleanup job error:', err);
    }
  }, 24 * 60 * 60 * 1000); // every 24h
})();
