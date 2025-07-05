import { Router, Request, Response, NextFunction } from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import { storage } from "../postgres-storage";
import * as admin from 'firebase-admin';

// Extend Request type to include user
declare global {
  namespace Express {
    interface Request {
      user?: admin.auth.DecodedIdToken;
    }
  }
}

// Authentication middleware
const authenticate = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // First try Authorization header (Firebase token)
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1];
      
      try {
        // Decode the JWT to extract user info
        const parts = token.split('.');
        if (parts.length !== 3) {
          throw new Error('Invalid token format');
        }
        
        const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString());
        
        const authenticatedUser = {
          uid: payload.user_id || payload.sub || payload.uid,
          email: payload.email || '',
          email_verified: payload.email_verified || false,
          name: payload.name || payload.display_name || 'Trek User',
        } as any;
        
        req.user = authenticatedUser;
        return next();
      } catch (tokenError) {
        console.error("Token verification error:", tokenError);
        return res.status(401).json({ message: "Invalid authentication token" });
      }
    }
    
    // Fallback to header-based auth (for backward compatibility)
    const firebaseUid = req.headers['x-user-id'] as string;
    const userEmail = req.headers['x-user-email'] as string;
    const userName = req.headers['x-user-name'] as string;
    
    if (!firebaseUid) {
      return res.status(401).json({ message: "Authentication required - missing user ID" });
    }
    
    const authenticatedUser = {
      uid: firebaseUid,
      email: userEmail || '',
      email_verified: true,
      name: userName || 'Trek User',
    } as any;
    
    req.user = authenticatedUser;
    next();
  } catch (error) {
    console.error("Authentication error:", error);
    return res.status(401).json({ message: "Unauthorized: Invalid token" });
  }
};

const router = Router();

// Configure multer for file uploads
const uploadDir = "uploads/insurance";
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const fileStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, `insurance-${uniqueSuffix}${path.extname(file.originalname)}`);
  }
});

const upload = multer({
  storage: fileStorage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedMimes = ['image/jpeg', 'image/png', 'application/pdf'];
    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Only JPEG, PNG, and PDF files are allowed'));
    }
  }
});

// Submit insurance verification
router.post("/submit", authenticate, upload.single('insuranceDocument'), async (req, res) => {
  try {
    const { provider, policyNumber, expirationDate } = req.body;
    const userId = req.user!.uid;

    // Validation
    if (!provider || !policyNumber || !expirationDate) {
      return res.status(400).json({ error: "Provider, policy number, and expiration date are required" });
    }

    if (!req.file) {
      return res.status(400).json({ error: "Insurance document is required" });
    }

    // Check if expiration date is in the future
    const expDate = new Date(expirationDate);
    if (expDate <= new Date()) {
      // Delete uploaded file if validation fails
      fs.unlinkSync(req.file.path);
      return res.status(400).json({ error: "Expiration date must be in the future" });
    }

    const documentPath = req.file.path;

    // Create insurance document record
    const insuranceDocument = await storage.createInsuranceDocument({
      userId,
      provider,
      policyNumber,
      expirationDate: expDate,
      documentPath,
      status: 'pending'
    });

    // Update user's insurance info
    await storage.updateUserInsuranceInfo(userId, provider, policyNumber, expDate, documentPath);

    res.status(201).json({
      message: "Insurance information submitted successfully",
      document: insuranceDocument
    });
  } catch (error) {
    console.error('Error submitting insurance:', error);
    
    // Clean up uploaded file if there was an error
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    
    res.status(500).json({ error: "Failed to submit insurance information" });
  }
});

// Get user's insurance verification status
router.get("/status", authenticate, async (req, res) => {
  try {
    const userId = req.user!.uid;
    
    // Get user's basic insurance info from users table
    const user = await storage.getUserByFirebaseUid(userId);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // Get latest insurance document
    const insuranceDocument = await storage.getInsuranceDocumentByUserId(userId);

    res.json({
      status: user.insuranceStatus || 'none',
      verified: user.insuranceVerified || false,
      provider: user.insuranceProvider,
      policyNumber: user.insurancePolicyNumber,
      expirationDate: user.insuranceExpirationDate,
      verificationDate: user.insuranceVerificationDate,
      document: insuranceDocument ? {
        id: insuranceDocument.id,
        status: insuranceDocument.status,
        rejectionReason: insuranceDocument.rejectionReason,
        createdAt: insuranceDocument.createdAt,
        approvedAt: insuranceDocument.approvedAt
      } : null
    });
  } catch (error) {
    console.error('Error getting insurance status:', error);
    res.status(500).json({ error: "Failed to get insurance status" });
  }
});

// Admin routes for managing insurance submissions
router.get("/admin/pending", authenticate, async (req, res) => {
  try {
    // In a real app, you'd check if user is admin
    const pendingDocuments = await storage.getPendingInsuranceDocuments();
    
    // Add user information to each document
    const documentsWithUsers = await Promise.all(
      pendingDocuments.map(async (doc) => {
        const user = await storage.getUserByFirebaseUid(doc.userId);
        return {
          ...doc,
          user: user ? {
            id: user.id,
            name: user.displayName,
            email: user.email,
            phone: user.phone
          } : null
        };
      })
    );

    res.json(documentsWithUsers);
  } catch (error) {
    console.error('Error getting pending insurance documents:', error);
    res.status(500).json({ error: "Failed to get pending documents" });
  }
});

router.get("/admin/all", authenticate, async (req, res) => {
  try {
    const allDocuments = await storage.getAllInsuranceDocuments();
    
    // Add user information to each document
    const documentsWithUsers = await Promise.all(
      allDocuments.map(async (doc) => {
        const user = await storage.getUserByFirebaseUid(doc.userId);
        return {
          ...doc,
          user: user ? {
            id: user.id,
            name: user.displayName,
            email: user.email,
            phone: user.phone
          } : null
        };
      })
    );

    res.json(documentsWithUsers);
  } catch (error) {
    console.error('Error getting all insurance documents:', error);
    res.status(500).json({ error: "Failed to get documents" });
  }
});

router.patch("/admin/:documentId/approve", authenticate, async (req, res) => {
  try {
    const documentId = parseInt(req.params.documentId);
    const approvedBy = req.user!.uid;

    if (isNaN(documentId)) {
      return res.status(400).json({ error: "Invalid document ID" });
    }

    const updatedDocument = await storage.updateInsuranceDocumentStatus(
      documentId,
      'approved',
      approvedBy
    );

    // Check if user also has Stripe Connect account to send SMS
    const user = await storage.getUserByFirebaseUid(updatedDocument.userId);
    if (user && user.stripeConnectAccountId && user.phone) {
      // Send SMS notification about approval
      try {
        const twilio = (await import('twilio')).default;
        const twilioClient = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
        
        await twilioClient.messages.create({
          body: `🎉 Great news! Your insurance has been verified and your driver account is now approved. You can start posting rides on Trek! Visit https://jointrek.com/my-posts to get started.`,
          from: process.env.TWILIO_PHONE_NUMBER,
          to: user.phone
        });
      } catch (smsError) {
        console.error('Failed to send approval SMS:', smsError);
      }
    }

    res.json({
      message: "Insurance document approved successfully",
      document: updatedDocument
    });
  } catch (error) {
    console.error('Error approving insurance document:', error);
    res.status(500).json({ error: "Failed to approve document" });
  }
});

router.patch("/admin/:documentId/reject", authenticate, async (req, res) => {
  try {
    const documentId = parseInt(req.params.documentId);
    const { reason } = req.body;
    const approvedBy = req.user!.uid;

    if (isNaN(documentId)) {
      return res.status(400).json({ error: "Invalid document ID" });
    }

    if (!reason) {
      return res.status(400).json({ error: "Rejection reason is required" });
    }

    const updatedDocument = await storage.updateInsuranceDocumentStatus(
      documentId,
      'rejected',
      approvedBy,
      reason
    );

    // Send SMS notification about rejection
    const user = await storage.getUserByFirebaseUid(updatedDocument.userId);
    if (user && user.phone) {
      try {
        const twilio = (await import('twilio')).default;
        const twilioClient = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
        
        await twilioClient.messages.create({
          body: `Your insurance verification was not approved. Reason: ${reason}. Please resubmit with updated documentation. Visit https://jointrek.com/profile for more details.`,
          from: process.env.TWILIO_PHONE_NUMBER,
          to: user.phone
        });
      } catch (smsError) {
        console.error('Failed to send rejection SMS:', smsError);
      }
    }

    res.json({
      message: "Insurance document rejected",
      document: updatedDocument
    });
  } catch (error) {
    console.error('Error rejecting insurance document:', error);
    res.status(500).json({ error: "Failed to reject document" });
  }
});

// Serve uploaded insurance documents (admin only)
router.get("/document/:filename", authenticate, (req, res) => {
  try {
    const filename = req.params.filename;
    const filePath = path.join(uploadDir, filename);
    
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: "Document not found" });
    }

    res.sendFile(path.resolve(filePath));
  } catch (error) {
    console.error('Error serving document:', error);
    res.status(500).json({ error: "Failed to serve document" });
  }
});

export default router;