import { Router, Request, Response } from "express";
import { storage } from "../postgres-storage";

const router = Router();

// GET /api/user-rides - Get rides for the current user
router.get("/", async (req: Request, res: Response) => {
  try {
    if (!req.user || !req.user.uid) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const rides = await storage.getRidesByDriver(req.user.uid);
    res.json(rides);
  } catch (error) {
    console.error("Error fetching user rides:", error);
    res.status(500).json({ error: "Failed to fetch rides" });
  }
});

export default router;