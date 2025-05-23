import React, { useState, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { FaUpload, FaCheckCircle, FaTimesCircle, FaIdCard, FaShieldAlt } from 'react-icons/fa';
import { apiRequest } from '@/lib/queryClient';

interface VerificationResult {
  passed: boolean;
  score: number;
  documentType: string;
  firstName: string;
  lastName: string;
}

export default function IDVerification() {
  const [isVerifying, setIsVerifying] = useState(false);
  const [verificationResult, setVerificationResult] = useState<VerificationResult | null>(null);
  const [isVerified, setIsVerified] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      toast({
        title: "Invalid file type",
        description: "Please upload a JPEG, PNG, or WebP image of your ID.",
        variant: "destructive",
      });
      return;
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      toast({
        title: "File too large",
        description: "Please upload an image smaller than 10MB.",
        variant: "destructive",
      });
      return;
    }

    await verifyDocument(file);
  };

  const verifyDocument = async (file: File) => {
    setIsVerifying(true);
    setVerificationResult(null);

    try {
      // Convert file to base64
      const base64 = await fileToBase64(file);

      const response = await fetch('/api/id-verification/verify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          documentImage: base64,
          documentType: 'auto'
        }),
      });

      const data = await response.json();

      if (data.success) {
        setVerificationResult(data.verification);
        setIsVerified(data.verification.passed);
        
        toast({
          title: data.verification.passed ? "ID Verified Successfully!" : "Verification Failed",
          description: data.verification.passed 
            ? "Your identity has been verified. You now have enhanced trust on GatorLift!"
            : "We couldn't verify your ID. Please try with a clearer image.",
          variant: data.verification.passed ? "default" : "destructive",
        });
      } else {
        throw new Error(data.error || 'Verification failed');
      }
    } catch (error) {
      console.error('ID verification error:', error);
      toast({
        title: "Verification Error",
        description: "There was an issue verifying your ID. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsVerifying(false);
    }
  };

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = error => reject(error);
    });
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FaShieldAlt className="text-primary" />
          ID Verification
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Verify your identity to build trust with other riders. We use secure ID verification to keep GatorLift safe for all UF students.
        </p>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Current verification status */}
        {isVerified ? (
          <div className="bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <FaCheckCircle className="text-green-600" />
              <span className="font-semibold text-green-800 dark:text-green-200">Verified</span>
              <Badge variant="secondary" className="bg-green-100 text-green-800">
                Trusted Rider
              </Badge>
            </div>
            <p className="text-sm text-green-700 dark:text-green-300">
              Your identity has been verified! Other riders can see you're a verified student.
            </p>
            {verificationResult && (
              <div className="mt-2 text-xs text-green-600 dark:text-green-400">
                Document: {verificationResult.documentType} • Score: {verificationResult.score}%
              </div>
            )}
          </div>
        ) : (
          <div className="bg-orange-50 dark:bg-orange-950 border border-orange-200 dark:border-orange-800 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <FaTimesCircle className="text-orange-600" />
              <span className="font-semibold text-orange-800 dark:text-orange-200">Not Verified</span>
            </div>
            <p className="text-sm text-orange-700 dark:text-orange-300">
              Verify your identity to build trust with other riders and enhance your profile.
            </p>
          </div>
        )}

        {/* Upload section */}
        <div className="space-y-4">
          <div className="text-sm space-y-2">
            <p className="font-medium">Upload your government-issued ID:</p>
            <ul className="text-muted-foreground space-y-1 text-xs">
              <li>• Driver's License, Passport, or State ID</li>
              <li>• Clear, well-lit photo showing all text</li>
              <li>• Accepted formats: JPEG, PNG, WebP (max 10MB)</li>
              <li>• Your personal information is processed securely and not stored</li>
            </ul>
          </div>

          <div className="flex flex-col gap-3">
            <Input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/jpg,image/png,image/webp"
              onChange={handleFileUpload}
              className="hidden"
            />
            
            <Button 
              onClick={triggerFileInput}
              disabled={isVerifying}
              className="w-full flex items-center gap-2"
              variant={isVerified ? "outline" : "default"}
            >
              <FaUpload />
              {isVerifying ? "Verifying..." : isVerified ? "Upload New ID" : "Upload ID Document"}
            </Button>

            {isVerifying && (
              <div className="text-center">
                <div className="inline-flex items-center gap-2 text-sm text-muted-foreground">
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-primary border-t-transparent"></div>
                  Analyzing document...
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Verification result details */}
        {verificationResult && !isVerifying && (
          <div className="border rounded-lg p-4 space-y-3">
            <h4 className="font-medium flex items-center gap-2">
              <FaIdCard />
              Verification Results
            </h4>
            
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-muted-foreground">Status:</span>
                <div className="font-medium">
                  {verificationResult.passed ? (
                    <span className="text-green-600">✓ Verified</span>
                  ) : (
                    <span className="text-red-600">✗ Failed</span>
                  )}
                </div>
              </div>
              
              <div>
                <span className="text-muted-foreground">Confidence:</span>
                <div className="font-medium">{verificationResult.score}%</div>
              </div>
              
              <div>
                <span className="text-muted-foreground">Document Type:</span>
                <div className="font-medium">{verificationResult.documentType}</div>
              </div>
              
              <div>
                <span className="text-muted-foreground">Name Match:</span>
                <div className="font-medium">
                  {verificationResult.firstName} {verificationResult.lastName}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Security notice */}
        <div className="bg-muted/50 rounded-lg p-4">
          <div className="flex items-start gap-2">
            <FaShieldAlt className="text-primary mt-0.5 flex-shrink-0" />
            <div className="text-xs text-muted-foreground space-y-1">
              <p className="font-medium">Your Privacy is Protected</p>
              <p>• ID verification is processed securely through ID Analyzer</p>
              <p>• We only store verification status, not your ID image or personal details</p>
              <p>• Data is encrypted and processed in the US for compliance</p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}