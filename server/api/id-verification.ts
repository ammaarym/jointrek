import { Router, Request, Response } from 'express';
// Use built-in fetch for modern Node.js

const router = Router();

// ID Analyzer API endpoint (US region)
const ID_ANALYZER_BASE_URL = 'https://api2.idanalyzer.com';

interface IDAnalyzerResponse {
  success: boolean;
  error?: {
    code: string;
    message: string;
  };
  result?: {
    documentType: string;
    firstName: string;
    lastName: string;
    dateOfBirth: string;
    documentNumber: string;
    address: string;
    verification: {
      passed: boolean;
      score: number;
    };
  };
}

// Verify ID document
router.post('/verify', async (req: Request, res: Response) => {
  try {
    const { documentImage, documentType = 'auto' } = req.body;

    if (!documentImage) {
      return res.status(400).json({
        success: false,
        error: 'Document image is required'
      });
    }

    // Remove data:image/jpeg;base64, prefix if present
    const base64Data = documentImage.replace(/^data:image\/[a-z]+;base64,/, '');

    const requestBody = {
      document: base64Data,
      type: documentType,
      accuracy: 'high',
      authenticate: true,
      vault: false // Don't store in vault for privacy
    };

    const response = await fetch(`${ID_ANALYZER_BASE_URL}/scan`, {
      method: 'POST',
      headers: {
        'X-API-KEY': process.env.ID_ANALYZER_API_KEY!,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    const data: IDAnalyzerResponse = await response.json();

    if (!data.success) {
      return res.status(400).json({
        success: false,
        error: data.error?.message || 'ID verification failed'
      });
    }

    // Return sanitized verification result
    res.json({
      success: true,
      verification: {
        passed: data.result?.verification.passed || false,
        score: data.result?.verification.score || 0,
        documentType: data.result?.documentType,
        firstName: data.result?.firstName,
        lastName: data.result?.lastName,
        // Don't return sensitive info like full document number or address
      }
    });

  } catch (error) {
    console.error('ID verification error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error during verification'
    });
  }
});

// Check verification status
router.get('/status/:userId', async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    
    // TODO: Get verification status from database
    // For now, return mock status
    res.json({
      success: true,
      verified: false,
      verificationDate: null,
      documentType: null
    });

  } catch (error) {
    console.error('Verification status error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get verification status'
    });
  }
});

export default router;