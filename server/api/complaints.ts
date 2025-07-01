import { Request, Response, NextFunction } from 'express';
import { storage } from "../postgres-storage";
import { insertComplaintSchema } from "@shared/schema";
import { z } from "zod";

// Create a new complaint
export const createComplaint = async (req: Request, res: Response) => {
  try {
    console.log('Creating complaint with data:', req.body);
    
    // Validate the request body
    const validatedData = insertComplaintSchema.parse(req.body);
    
    console.log('Validated complaint data:', validatedData);
    
    // Create the complaint
    const complaint = await storage.createComplaint(validatedData);
    
    console.log('Created complaint:', complaint);
    
    res.status(201).json(complaint);
  } catch (error) {
    console.error('Error creating complaint:', error);
    
    if (error instanceof z.ZodError) {
      return res.status(400).json({ 
        error: 'Validation failed', 
        details: error.errors 
      });
    }
    
    res.status(500).json({ 
      error: 'Failed to create complaint',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

// Get all complaints with full details (admin only)
export const getAllComplaints = async (req: Request, res: Response) => {
  try {
    console.log('Fetching all complaints for admin dashboard');
    
    const complaints = await storage.getAllComplaints();
    
    // For each complaint, fetch passenger information if it's related to a ride
    const complaintsWithPassengers = await Promise.all(
      complaints.map(async (complaint) => {
        if (complaint.rideId) {
          try {
            const passengers = await storage.getComplaintsWithPassengers(complaint.rideId);
            return {
              ...complaint,
              passengers: passengers.filter(p => p.requestStatus === 'approved') // Only approved passengers
            };
          } catch (error) {
            console.error(`Error fetching passengers for ride ${complaint.rideId}:`, error);
            return {
              ...complaint,
              passengers: []
            };
          }
        }
        return {
          ...complaint,
          passengers: []
        };
      })
    );
    
    console.log(`Found ${complaints.length} complaints with passenger data`);
    
    res.json(complaintsWithPassengers);
  } catch (error) {
    console.error('Error fetching complaints:', error);
    res.status(500).json({ 
      error: 'Failed to fetch complaints',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

// Get a specific complaint by ID
export const getComplaintById = async (req: Request, res: Response) => {
  try {
    const complaintId = parseInt(req.params.id);
    
    if (isNaN(complaintId)) {
      return res.status(400).json({ error: 'Invalid complaint ID' });
    }
    
    console.log('Fetching complaint with ID:', complaintId);
    
    const complaint = await storage.getComplaintById(complaintId);
    
    if (!complaint) {
      return res.status(404).json({ error: 'Complaint not found' });
    }
    
    console.log('Found complaint:', complaint);
    
    res.json(complaint);
  } catch (error) {
    console.error('Error fetching complaint:', error);
    res.status(500).json({ 
      error: 'Failed to fetch complaint',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

// Update complaint status and admin notes
export const updateComplaintStatus = async (req: Request, res: Response) => {
  try {
    const complaintId = parseInt(req.params.id);
    const { status, adminNotes } = req.body;
    
    if (isNaN(complaintId)) {
      return res.status(400).json({ error: 'Invalid complaint ID' });
    }
    
    if (!status) {
      return res.status(400).json({ error: 'Status is required' });
    }
    
    console.log('Updating complaint status:', { complaintId, status, adminNotes });
    
    const updatedComplaint = await storage.updateComplaintStatus(complaintId, status, adminNotes);
    
    if (!updatedComplaint) {
      return res.status(404).json({ error: 'Complaint not found' });
    }
    
    console.log('Updated complaint:', updatedComplaint);
    
    res.json(updatedComplaint);
  } catch (error) {
    console.error('Error updating complaint status:', error);
    res.status(500).json({ 
      error: 'Failed to update complaint status',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

// Update complaint priority
export const updateComplaintPriority = async (req: Request, res: Response) => {
  try {
    const complaintId = parseInt(req.params.id);
    const { priority } = req.body;
    
    if (isNaN(complaintId)) {
      return res.status(400).json({ error: 'Invalid complaint ID' });
    }
    
    if (!priority) {
      return res.status(400).json({ error: 'Priority is required' });
    }
    
    console.log('Updating complaint priority:', { complaintId, priority });
    
    const updatedComplaint = await storage.updateComplaintPriority(complaintId, priority);
    
    if (!updatedComplaint) {
      return res.status(404).json({ error: 'Complaint not found' });
    }
    
    console.log('Updated complaint priority:', updatedComplaint);
    
    res.json(updatedComplaint);
  } catch (error) {
    console.error('Error updating complaint priority:', error);
    res.status(500).json({ 
      error: 'Failed to update complaint priority',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

// Get passengers for a specific ride (used for complaint context)
export const getRidePassengers = async (req: Request, res: Response) => {
  try {
    const rideId = parseInt(req.params.rideId);
    
    if (isNaN(rideId)) {
      return res.status(400).json({ error: 'Invalid ride ID' });
    }
    
    console.log('Fetching passengers for ride:', rideId);
    
    const passengers = await storage.getComplaintsWithPassengers(rideId);
    
    console.log(`Found ${passengers.length} passengers for ride ${rideId}`);
    
    res.json(passengers);
  } catch (error) {
    console.error('Error fetching ride passengers:', error);
    res.status(500).json({ 
      error: 'Failed to fetch ride passengers',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};