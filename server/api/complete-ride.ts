import { Request, Response } from 'express';
import { storage } from '../postgres-storage';

export async function completeRide(req: Request, res: Response) {
  try {
    const rideId = parseInt(req.params.id);
    
    if (isNaN(rideId)) {
      return res.status(400).json({ error: 'Invalid ride ID' });
    }

    const updatedRide = await storage.markRideComplete(rideId);
    
    if (!updatedRide) {
      return res.status(404).json({ error: 'Ride not found' });
    }

    res.json(updatedRide);
  } catch (error) {
    console.error('Error marking ride complete:', error);
    res.status(500).json({ error: 'Failed to mark ride complete' });
  }
}