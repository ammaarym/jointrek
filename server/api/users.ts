import { Router, Request, Response } from "express";
import { storage } from "../postgres-storage";
import { insertUserSchema } from "@shared/schema";
import { z } from "zod";

const router = Router();

// GET /api/users/firebase/:firebaseUid - Get a user by Firebase UID
router.get("/firebase/:firebaseUid", async (req: Request, res: Response) => {
  try {
    const firebaseUid = req.params.firebaseUid;
    
    const user = await storage.getUserByFirebaseUid(firebaseUid);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }
    
    res.json(user);
  } catch (error) {
    console.error("Error fetching user by Firebase UID:", error);
    res.status(500).json({ error: "Failed to fetch user" });
  }
});

// POST /api/users - Create a new user
router.post("/", async (req: Request, res: Response) => {
  try {
    // Validate the request body against our schema
    const validationResult = insertUserSchema.safeParse(req.body);
    
    if (!validationResult.success) {
      return res.status(400).json({ 
        error: "Invalid user data", 
        details: validationResult.error.format() 
      });
    }
    
    // Check if the user already exists by Firebase UID
    const existingUser = await storage.getUserByFirebaseUid(req.body.firebaseUid);
    if (existingUser) {
      return res.status(409).json({ error: "User already exists" });
    }
    
    // Create the user in the database
    const user = await storage.createUser(validationResult.data);
    
    res.status(201).json(user);
  } catch (error) {
    console.error("Error creating user:", error);
    res.status(500).json({ error: "Failed to create user" });
  }
});

export default router;