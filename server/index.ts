import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import { storage } from "./postgres-storage";

const app = express();
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: false, limit: '50mb' }));

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

// Function to clean up expired rides
async function cleanupExpiredRides() {
  try {
    const deletedCount = await storage.deleteExpiredRides();
    if (deletedCount > 0) {
      console.log(`Daily cleanup: Removed ${deletedCount} expired rides`);
    }
  } catch (error) {
    console.error('Error during daily cleanup:', error);
  }
}

// Function to handle automatic payment processing after 24 hours
async function processAutomaticPaymentCapture() {
  try {
    const stripe = (await import('stripe')).default;
    const stripeInstance = new stripe(process.env.STRIPE_SECRET_KEY!, {
      apiVersion: '2025-05-28.basil',
    });

    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const expiredAuthorizations = await storage.getExpiredAuthorizedPayments(twentyFourHoursAgo);
    
    console.log(`Found ${expiredAuthorizations.length} expired payment authorizations`);
    
    for (const request of expiredAuthorizations) {
      try {
        if (request.stripePaymentIntentId) {
          if (request.status === 'approved') {
            // Capture payment for approved requests
            console.log(`Auto-capturing payment for approved request ${request.id}: ${request.stripePaymentIntentId}`);
            
            await stripeInstance.paymentIntents.capture(request.stripePaymentIntentId);
            await storage.updateRideRequestPaymentStatus(request.id, 'captured');
            
            console.log(`Auto-captured payment for request ${request.id}`);
          } else if (request.status === 'pending') {
            // Cancel and refund payment for unaccepted requests
            console.log(`Auto-canceling unaccepted request ${request.id}: ${request.stripePaymentIntentId}`);
            
            await stripeInstance.paymentIntents.cancel(request.stripePaymentIntentId);
            await storage.updateRideRequestStatus(request.id, 'canceled', request.driverId || '');
            await storage.updateRideRequestPaymentStatus(request.id, 'canceled');
            
            console.log(`Auto-canceled and refunded payment for unaccepted request ${request.id}`);
          }
        }
      } catch (error: any) {
        console.error(`Failed to process payment for request ${request.id}:`, error.message);
      }
    }
  } catch (error) {
    console.error('Error during automatic payment processing:', error);
  }
}

// Schedule daily cleanup and payment processing at 2 AM
function scheduleDailyCleanup() {
  const now = new Date();
  const next2AM = new Date(now);
  
  // Set to 2 AM today
  next2AM.setHours(2, 0, 0, 0);
  
  // If 2 AM today has passed, schedule for tomorrow
  if (next2AM <= now) {
    next2AM.setDate(next2AM.getDate() + 1);
  }
  
  const timeUntilNext2AM = next2AM.getTime() - now.getTime();
  
  setTimeout(() => {
    cleanupExpiredRides();
    processAutomaticPaymentCapture();
    // Schedule to run every 24 hours after the first run
    setInterval(() => {
      cleanupExpiredRides();
      processAutomaticPaymentCapture();
    }, 24 * 60 * 60 * 1000);
  }, timeUntilNext2AM);
  
  console.log(`Daily cleanup and payment processing scheduled for ${next2AM.toLocaleString()}`);
}

(async () => {
  const server = await registerRoutes(app);

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    res.status(status).json({ message });
    throw err;
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
  server.listen({
    port,
    host: "0.0.0.0",
    reusePort: true,
  }, () => {
    log(`serving on port ${port}`);
    
    // Start the daily cleanup scheduler
    scheduleDailyCleanup();
  });
})();
