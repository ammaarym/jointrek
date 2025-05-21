import { Router, Request, Response } from "express";
import { storage } from "../postgres-storage";

const router = Router();

// GET /api/user-rides - Get rides for the current user
router.get("/", async (req: Request, res: Response) => {
  try {
    // Get the driver ID from headers for authentication
    const driverId = req.headers['x-user-id'] as string;
    
    if (!driverId) {
      console.log('No driver ID found in headers');
      return res.status(401).json({ error: "Unauthorized" });
    }
    
    console.log('Fetching rides for driver:', driverId);

    const rides = await storage.getRidesByDriver(driverId);
    console.log('Rides found:', rides.length);
    res.json(rides);
  } catch (error) {
    console.error("Error fetching user rides:", error);
    res.status(500).json({ error: "Failed to fetch rides" });
  }
});

export default router;