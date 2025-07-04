import { useState, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/use-auth-fixed';
import { ShieldCheck, AlertTriangle, FileText, Calendar, Upload, X, CheckCircle2, Clock, AlertCircle } from 'lucide-react';

const insuranceSchema = z.object({
  insuranceProvider: z.string().min(1, 'Insurance provider is required'),
  insurancePolicyNumber: z.string().min(1, 'Policy number is required'),
  insuranceExpirationDate: z.string().min(1, 'Expiration date is required')
});

type InsuranceFormData = z.infer<typeof insuranceSchema>;

interface InsuranceVerificationProps {
  currentInsurance?: {
    insuranceProvider: string | null;
    insurancePolicyNumber: string | null;
    insuranceExpirationDate: string | null;
    insuranceVerified: boolean;
  };
  onUpdate: () => void;
}

const INSURANCE_PROVIDERS = [
  'GEICO', 'State Farm', 'Progressive', 'Allstate', 'USAA', 'Liberty Mutual',
  'Farmers', 'Nationwide', 'American Family', 'Travelers', 'Auto-Owners',
  'Esurance', 'The General', 'Root', 'Lemonade', 'Other'
];

type VerificationStep = 'instant' | 'upload' | 'verified' | 'pending';

export function InsuranceVerificationEnhanced({ currentInsurance, onUpdate }: InsuranceVerificationProps) {
  const [currentStep, setCurrentStep] = useState<VerificationStep>('instant');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [instantVerificationFailed, setInstantVerificationFailed] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const { currentUser } = useAuth();

  const form = useForm<InsuranceFormData>({
    resolver: zodResolver(insuranceSchema),
    defaultValues: {
      insuranceProvider: currentInsurance?.insuranceProvider || '',
      insurancePolicyNumber: currentInsurance?.insurancePolicyNumber || '',
      insuranceExpirationDate: currentInsurance?.insuranceExpirationDate || ''
    }
  });

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const validFiles = files.filter(file => {
      const isValidType = ['image/jpeg', 'image/png', 'application/pdf'].includes(file.type);
      const isValidSize = file.size <= 10 * 1024 * 1024; // 10MB
      return isValidType && isValidSize;
    });

    if (validFiles.length !== files.length) {
      toast({
        title: "Invalid files",
        description: "Only JPEG, PNG, and PDF files under 10MB are allowed.",
        variant: "destructive"
      });
    }

    setUploadedFiles(prev => [...prev, ...validFiles]);
  };

  const removeFile = (index: number) => {
    setUploadedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleInstantVerification = async (data: InsuranceFormData) => {
    setIsSubmitting(true);
    
    try {
      // Simulate instant verification API call
      const response = await fetch('/api/insurance/verify-instant', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${await currentUser?.getIdToken()}`
        },
        body: JSON.stringify(data)
      });

      if (response.ok) {
        const result = await response.json();
        
        if (result.verified) {
          setCurrentStep('verified');
          toast({
            title: "Insurance Verified!",
            description: "Your insurance has been successfully verified.",
            variant: "default"
          });
          onUpdate();
        } else {
          // Instant verification failed, move to upload step
          setInstantVerificationFailed(true);
          setCurrentStep('upload');
          toast({
            title: "Instant verification unavailable",
            description: "We couldn't verify your insurance automatically. Please upload your insurance card.",
            variant: "destructive"
          });
        }
      } else {
        throw new Error('Verification failed');
      }
    } catch (error) {
      setInstantVerificationFailed(true);
      setCurrentStep('upload');
      toast({
        title: "Instant verification unavailable",
        description: "We couldn't verify your insurance automatically. Please upload your insurance card.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDocumentUpload = async () => {
    if (uploadedFiles.length === 0) {
      toast({
        title: "No files selected",
        description: "Please upload your insurance documents.",
        variant: "destructive"
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const formData = new FormData();
      
      // Add form data
      const insuranceData = form.getValues();
      Object.entries(insuranceData).forEach(([key, value]) => {
        formData.append(key, value);
      });

      // Add files
      uploadedFiles.forEach(file => {
        formData.append('documents', file);
      });

      const response = await fetch('/api/insurance/upload-documents', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${await currentUser?.getIdToken()}`
        },
        body: formData
      });

      if (response.ok) {
        setCurrentStep('pending');
        toast({
          title: "Documents uploaded successfully",
          description: "Your insurance documents are being reviewed. This usually takes 1-2 business days.",
          variant: "default"
        });
        onUpdate();
      } else {
        throw new Error('Upload failed');
      }
    } catch (error) {
      toast({
        title: "Upload failed",
        description: "Failed to upload insurance documents. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderStepIndicator = () => (
    <div className="flex items-center justify-center mb-6 space-x-4">
      <div className={`flex items-center space-x-2 ${currentStep === 'instant' ? 'text-blue-600' : currentStep === 'upload' || currentStep === 'pending' || currentStep === 'verified' ? 'text-green-600' : 'text-gray-400'}`}>
        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold ${currentStep === 'instant' ? 'bg-blue-100 text-blue-600' : currentStep === 'upload' || currentStep === 'pending' || currentStep === 'verified' ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-400'}`}>
          {(currentStep === 'upload' || currentStep === 'pending' || currentStep === 'verified') ? <CheckCircle2 className="w-5 h-5" /> : '1'}
        </div>
        <span className="text-sm font-medium">Instant Verification</span>
      </div>
      
      <div className={`w-12 h-0.5 ${currentStep === 'upload' || currentStep === 'pending' || currentStep === 'verified' ? 'bg-green-600' : 'bg-gray-300'}`}></div>
      
      <div className={`flex items-center space-x-2 ${currentStep === 'upload' ? 'text-blue-600' : currentStep === 'pending' || currentStep === 'verified' ? 'text-green-600' : 'text-gray-400'}`}>
        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold ${currentStep === 'upload' ? 'bg-blue-100 text-blue-600' : currentStep === 'pending' || currentStep === 'verified' ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-400'}`}>
          {(currentStep === 'pending' || currentStep === 'verified') ? <CheckCircle2 className="w-5 h-5" /> : '2'}
        </div>
        <span className="text-sm font-medium">Document Upload</span>
      </div>
    </div>
  );

  const renderInstantVerificationStep = () => (
    <div className="space-y-6">
      <div className="text-center">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Step 1: Try Instant Insurance Verification</h3>
        <p className="text-gray-600">Enter your policy details and we'll verify it automatically.</p>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleInstantVerification)} className="space-y-4">
          <FormField
            control={form.control}
            name="insuranceProvider"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Insurance Provider</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select your insurance provider" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {INSURANCE_PROVIDERS.map((provider) => (
                      <SelectItem key={provider} value={provider}>
                        {provider}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="insurancePolicyNumber"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Policy Number</FormLabel>
                <FormControl>
                  <Input placeholder="Enter your insurance policy number" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="insuranceExpirationDate"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Expiration Date</FormLabel>
                <FormControl>
                  <Input type="date" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <Button 
            type="submit" 
            disabled={isSubmitting}
            className="w-full" style={{ backgroundColor: '#B8956B', color: 'white' }} onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#A17F5A'} onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#B8956B'}
          >
            {isSubmitting ? (
              <>
                <Clock className="w-4 h-4 mr-2 animate-spin" />
                Verifying Insurance...
              </>
            ) : (
              <>
                <ShieldCheck className="w-4 h-4 mr-2" />
                Verify Insurance Instantly
              </>
            )}
          </Button>
        </form>
      </Form>

      <div className="text-center">
        <Button
          variant="outline"
          onClick={() => setCurrentStep('upload')}
          className="border-2" 
          style={{ borderColor: '#B8956B', color: '#8A6F47' }} 
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = '#B8956B';
            e.currentTarget.style.color = 'white';
          }} 
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'transparent';
            e.currentTarget.style.color = '#8A6F47';
          }}
        >
          Skip to document upload instead
        </Button>
      </div>
    </div>
  );

  const renderDocumentUploadStep = () => (
    <div className="space-y-6">
      <div className="text-center">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Step 2: Upload Your Insurance Card</h3>
        <p className="text-gray-600">
          {instantVerificationFailed 
            ? "If we couldn't verify it instantly, you can upload your insurance card for manual approval. This usually takes 1–2 business days."
            : "Upload your insurance card for manual verification. This usually takes 1–2 business days."
          }
        </p>
      </div>

      {instantVerificationFailed && (
        <Alert className="border-amber-200 bg-amber-50">
          <AlertCircle className="h-4 w-4 text-amber-600" />
          <AlertDescription className="text-amber-800">
            We couldn't verify your insurance automatically. Please upload clear photos of your insurance card.
          </AlertDescription>
        </Alert>
      )}

      <div className="space-y-4">
        <div>
          <Label htmlFor="insurance-upload" className="text-sm font-medium text-gray-700">
            Insurance Documents
          </Label>
          <p className="text-xs text-gray-500 mb-2">
            Upload photos or scans of your insurance card or policy documents (JPEG, PNG, PDF)
          </p>
          
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 transition-colors">
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept=".jpg,.jpeg,.png,.pdf"
              onChange={handleFileSelect}
              className="hidden"
              id="insurance-upload"
            />
            <Upload className="mx-auto h-12 w-12 text-gray-400" />
            <p className="mt-2 text-sm text-gray-600">
              <Button
                type="button"
                variant="link"
                onClick={() => fileInputRef.current?.click()}
                className="text-blue-600 p-0 h-auto font-medium"
              >
                Choose Files
              </Button>{' '}
              or drag and drop
            </p>
            <p className="text-xs text-gray-500">Max 10MB per file • JPEG, PNG, PDF</p>
          </div>

          {uploadedFiles.length > 0 && (
            <div className="mt-4 space-y-2">
              <h4 className="text-sm font-medium text-gray-700">Uploaded Files:</h4>
              {uploadedFiles.map((file, index) => (
                <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                  <div className="flex items-center space-x-2">
                    <FileText className="h-4 w-4 text-gray-500" />
                    <span className="text-sm text-gray-700">{file.name}</span>
                    <span className="text-xs text-gray-500">
                      ({(file.size / 1024 / 1024).toFixed(1)} MB)
                    </span>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => removeFile(index)}
                    className="text-red-600 hover:text-red-700 h-6 w-6 p-0"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>

        <Button
          onClick={handleDocumentUpload}
          disabled={isSubmitting || uploadedFiles.length === 0}
          className="w-full" 
          style={{ backgroundColor: '#B8956B', color: 'white' }} 
          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#A17F5A'} 
          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#B8956B'}
        >
          {isSubmitting ? (
            <>
              <Clock className="w-4 h-4 mr-2 animate-spin" />
              Uploading Documents...
            </>
          ) : (
            <>
              <Upload className="w-4 h-4 mr-2" />
              Submit Insurance Documents
            </>
          )}
        </Button>
      </div>

      {!instantVerificationFailed && (
        <div className="text-center">
          <Button
            variant="outline"
            onClick={() => setCurrentStep('instant')}
            className="border-2" 
            style={{ borderColor: '#B8956B', color: '#8A6F47' }} 
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#B8956B';
              e.currentTarget.style.color = 'white';
            }} 
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent';
              e.currentTarget.style.color = '#8A6F47';
            }}
          >
            Try instant verification instead
          </Button>
        </div>
      )}
    </div>
  );

  const renderVerifiedStep = () => (
    <div className="text-center py-8">
      <CheckCircle2 className="w-16 h-16 text-green-600 mx-auto mb-4" />
      <h3 className="text-lg font-semibold text-gray-900 mb-2">Insurance Verified!</h3>
      <p className="text-gray-600">Your insurance has been successfully verified. You can now post rides.</p>
    </div>
  );

  const renderPendingStep = () => (
    <div className="text-center py-8">
      <Clock className="w-16 h-16 text-amber-600 mx-auto mb-4" />
      <h3 className="text-lg font-semibold text-gray-900 mb-2">Documents Under Review</h3>
      <p className="text-gray-600 mb-4">
        Your insurance documents have been submitted and are being reviewed. 
        This usually takes 1–2 business days.
      </p>
      <Alert className="border-blue-200 bg-blue-50 text-left">
        <AlertCircle className="h-4 w-4 text-blue-600" />
        <AlertDescription className="text-blue-800">
          You'll receive an email notification once your insurance is verified. You cannot post rides until verification is complete.
        </AlertDescription>
      </Alert>
    </div>
  );

  if (currentInsurance?.insuranceVerified) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <ShieldCheck className="mr-2 h-5 w-5 text-green-600" />
            Driver Insurance Verification
          </CardTitle>
          <CardDescription>
            All drivers must have verified insurance to ensure passenger safety and legal compliance.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {renderVerifiedStep()}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <ShieldCheck className="mr-2 h-5 w-5" />
          Driver Insurance Verification
        </CardTitle>
        <CardDescription>
          All drivers must have verified insurance to ensure passenger safety and legal compliance.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Alert className="border-red-200 bg-red-50 mb-6">
          <AlertTriangle className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-red-800">
            <strong>Insurance Required</strong><br />
            You must provide valid insurance information to post rides
          </AlertDescription>
        </Alert>

        {renderStepIndicator()}

        {currentStep === 'instant' && renderInstantVerificationStep()}
        {currentStep === 'upload' && renderDocumentUploadStep()}
        {currentStep === 'verified' && renderVerifiedStep()}
        {currentStep === 'pending' && renderPendingStep()}

        <div className="mt-6 p-4 bg-gray-50 rounded-lg">
          <h4 className="text-sm font-medium text-gray-700 mb-2">Important Notes:</h4>
          <ul className="text-sm text-gray-600 space-y-1">
            <li>• Insurance must be current and valid for the vehicle you'll be driving</li>
            <li>• Verification typically takes 24-48 hours during business days</li>
            <li>• You cannot post rides until your insurance is verified</li>
            <li>• Insurance information is kept confidential and secure</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}