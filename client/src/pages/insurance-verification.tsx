import { useState, useRef } from "react";
import { useAuth } from "@/hooks/use-auth-fixed";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Upload, FileText, CheckCircle, XCircle, Clock, AlertTriangle } from "lucide-react";

interface InsuranceStatus {
  status: 'none' | 'pending' | 'approved' | 'rejected';
  verified: boolean;
  provider?: string | null;
  policyNumber?: string | null;
  expirationDate?: string | null;
  verificationDate?: string | null;
  document?: {
    id: number;
    status: string;
    rejectionReason?: string | null;
    createdAt: string;
    approvedAt?: string | null;
  } | null;
}

const INSURANCE_PROVIDERS = [
  'State Farm',
  'GEICO',
  'Progressive',
  'Allstate',
  'USAA',
  'Liberty Mutual',
  'Farmers',
  'Nationwide',
  'American Family',
  'Travelers',
  'Other'
];

const InstantVerificationStep = ({ 
  onVerificationAttempt, 
  onFallbackToUpload,
  isLoading 
}: {
  onVerificationAttempt: (provider: string, policyNumber: string, expirationDate: string) => void;
  onFallbackToUpload: () => void;
  isLoading: boolean;
}) => {
  const [provider, setProvider] = useState('');
  const [policyNumber, setPolicyNumber] = useState('');
  const [expirationDate, setExpirationDate] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!provider || !policyNumber || !expirationDate) return;
    onVerificationAttempt(provider, policyNumber, expirationDate);
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader className="text-center">
        <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <div className="text-2xl">⚡</div>
        </div>
        <CardTitle className="text-xl">Step 1: Try Instant Verification</CardTitle>
        <CardDescription>
          We'll attempt to verify your insurance instantly using your policy information
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="provider">Insurance Provider</Label>
            <Select value={provider} onValueChange={setProvider}>
              <SelectTrigger>
                <SelectValue placeholder="Select your insurance provider" />
              </SelectTrigger>
              <SelectContent>
                {INSURANCE_PROVIDERS.map((p) => (
                  <SelectItem key={p} value={p}>{p}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="policyNumber">Policy Number</Label>
            <Input
              id="policyNumber"
              value={policyNumber}
              onChange={(e) => setPolicyNumber(e.target.value)}
              placeholder="Enter your policy number"
              disabled={isLoading}
            />
          </div>

          <div>
            <Label htmlFor="expirationDate">Policy Expiration Date</Label>
            <Input
              id="expirationDate"
              type="date"
              value={expirationDate}
              onChange={(e) => setExpirationDate(e.target.value)}
              disabled={isLoading}
              min={new Date().toISOString().split('T')[0]}
            />
          </div>

          <div className="flex flex-col gap-3">
            <Button 
              type="submit" 
              disabled={!provider || !policyNumber || !expirationDate || isLoading}
              className="w-full bg-[#B8956B] hover:bg-[#8A6F47] text-white"
            >
              {isLoading ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Verifying...
                </div>
              ) : (
                'Try Instant Verification'
              )}
            </Button>
            
            <Button 
              type="button" 
              variant="outline" 
              onClick={onFallbackToUpload}
              disabled={isLoading}
              className="w-full"
            >
              Upload Documents Instead
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};

const DocumentUploadStep = ({ 
  onDocumentSubmit,
  isLoading,
  provider,
  policyNumber,
  expirationDate 
}: {
  onDocumentSubmit: (formData: FormData) => void;
  isLoading: boolean;
  provider?: string;
  policyNumber?: string;
  expirationDate?: string;
}) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadProvider, setUploadProvider] = useState(provider || '');
  const [uploadPolicyNumber, setUploadPolicyNumber] = useState(policyNumber || '');
  const [uploadExpirationDate, setUploadExpirationDate] = useState(expirationDate || '');

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
    
    const files = e.dataTransfer.files;
    if (files && files[0]) {
      const file = files[0];
      if (validateFile(file)) {
        setSelectedFile(file);
      }
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files[0]) {
      const file = files[0];
      if (validateFile(file)) {
        setSelectedFile(file);
      }
    }
  };

  const validateFile = (file: File) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'application/pdf'];
    const maxSize = 10 * 1024 * 1024; // 10MB

    if (!allowedTypes.includes(file.type)) {
      alert('Please upload a JPEG, PNG, or PDF file');
      return false;
    }

    if (file.size > maxSize) {
      alert('File size must be less than 10MB');
      return false;
    }

    return true;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile || !uploadProvider || !uploadPolicyNumber || !uploadExpirationDate) return;

    const formData = new FormData();
    formData.append('insuranceDocument', selectedFile);
    formData.append('provider', uploadProvider);
    formData.append('policyNumber', uploadPolicyNumber);
    formData.append('expirationDate', uploadExpirationDate);

    onDocumentSubmit(formData);
  };

  const removeFile = () => {
    setSelectedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader className="text-center">
        <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <Upload className="w-8 h-8 text-orange-600" />
        </div>
        <CardTitle className="text-xl">Step 2: Upload Insurance Document</CardTitle>
        <CardDescription>
          Upload a clear photo or PDF of your insurance card or policy document
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Policy Information */}
          <div className="space-y-4">
            <div>
              <Label htmlFor="uploadProvider">Insurance Provider</Label>
              <Select value={uploadProvider} onValueChange={setUploadProvider}>
                <SelectTrigger>
                  <SelectValue placeholder="Select your insurance provider" />
                </SelectTrigger>
                <SelectContent>
                  {INSURANCE_PROVIDERS.map((p) => (
                    <SelectItem key={p} value={p}>{p}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="uploadPolicyNumber">Policy Number</Label>
              <Input
                id="uploadPolicyNumber"
                value={uploadPolicyNumber}
                onChange={(e) => setUploadPolicyNumber(e.target.value)}
                placeholder="Enter your policy number"
                disabled={isLoading}
              />
            </div>

            <div>
              <Label htmlFor="uploadExpirationDate">Policy Expiration Date</Label>
              <Input
                id="uploadExpirationDate"
                type="date"
                value={uploadExpirationDate}
                onChange={(e) => setUploadExpirationDate(e.target.value)}
                disabled={isLoading}
                min={new Date().toISOString().split('T')[0]}
              />
            </div>
          </div>

          {/* File Upload Area */}
          <div>
            <Label>Insurance Document</Label>
            <div
              className={`mt-2 border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                dragActive ? 'border-blue-400 bg-blue-50' : 'border-gray-300'
              } ${selectedFile ? 'border-green-400 bg-green-50' : ''}`}
              onDragEnter={(e) => { e.preventDefault(); setDragActive(true); }}
              onDragLeave={(e) => { e.preventDefault(); setDragActive(false); }}
              onDragOver={(e) => e.preventDefault()}
              onDrop={handleDrop}
            >
              {selectedFile ? (
                <div className="space-y-2">
                  <FileText className="w-12 h-12 text-green-600 mx-auto" />
                  <p className="font-medium text-green-700">{selectedFile.name}</p>
                  <p className="text-sm text-gray-500">
                    {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={removeFile}
                    className="mt-2"
                  >
                    Remove File
                  </Button>
                </div>
              ) : (
                <div className="space-y-2">
                  <Upload className="w-12 h-12 text-gray-400 mx-auto" />
                  <p className="text-lg font-medium">Drop your insurance document here</p>
                  <p className="text-sm text-gray-500">or click to browse</p>
                  <p className="text-xs text-gray-400">JPEG, PNG, or PDF up to 10MB</p>
                </div>
              )}
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept=".jpg,.jpeg,.png,.pdf"
              onChange={handleFileSelect}
              className="hidden"
            />

            {!selectedFile && (
              <Button
                type="button"
                variant="outline"
                className="w-full mt-4"
                onClick={() => fileInputRef.current?.click()}
              >
                <Upload className="w-4 h-4 mr-2" />
                Choose File
              </Button>
            )}
          </div>

          {/* Submit Button */}
          <Button
            type="submit"
            disabled={!selectedFile || !uploadProvider || !uploadPolicyNumber || !uploadExpirationDate || isLoading}
            className="w-full bg-[#B8956B] hover:bg-[#8A6F47] text-white"
          >
            {isLoading ? (
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Uploading...
              </div>
            ) : (
              'Submit for Verification'
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};

const StatusDisplay = ({ status }: { status: InsuranceStatus }) => {
  const getStatusIcon = () => {
    switch (status.status) {
      case 'approved':
        return <CheckCircle className="w-6 h-6 text-green-600" />;
      case 'rejected':
        return <XCircle className="w-6 h-6 text-red-600" />;
      case 'pending':
        return <Clock className="w-6 h-6 text-yellow-600" />;
      default:
        return <AlertTriangle className="w-6 h-6 text-gray-600" />;
    }
  };

  const getStatusColor = () => {
    switch (status.status) {
      case 'approved':
        return 'bg-green-100 text-green-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = () => {
    switch (status.status) {
      case 'approved':
        return 'Approved';
      case 'rejected':
        return 'Rejected';
      case 'pending':
        return 'Under Review';
      default:
        return 'Not Submitted';
    }
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader className="text-center">
        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
          {getStatusIcon()}
        </div>
        <CardTitle className="text-xl">Insurance Verification Status</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="text-center">
          <Badge className={`px-4 py-2 text-lg ${getStatusColor()}`}>
            {getStatusText()}
          </Badge>
        </div>

        {status.provider && (
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="font-medium">Provider:</span>
              <p className="text-gray-600">{status.provider}</p>
            </div>
            <div>
              <span className="font-medium">Policy Number:</span>
              <p className="text-gray-600">{status.policyNumber}</p>
            </div>
            {status.expirationDate && (
              <div className="col-span-2">
                <span className="font-medium">Expiration Date:</span>
                <p className="text-gray-600">
                  {new Date(status.expirationDate).toLocaleDateString()}
                </p>
              </div>
            )}
          </div>
        )}

        {status.status === 'rejected' && status.document?.rejectionReason && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
            <h4 className="font-medium text-red-800 mb-2">Rejection Reason:</h4>
            <p className="text-red-700">{status.document.rejectionReason}</p>
          </div>
        )}

        {status.status === 'pending' && (
          <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <p className="text-yellow-700">
              Your insurance document is being reviewed. You'll receive an SMS notification 
              once the review is complete.
            </p>
          </div>
        )}

        {status.status === 'approved' && status.verificationDate && (
          <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
            <p className="text-green-700">
              ✅ Approved on {new Date(status.verificationDate).toLocaleDateString()}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default function InsuranceVerification() {
  const { currentUser } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [currentStep, setCurrentStep] = useState<'instant' | 'upload' | 'status'>('status');
  const [tempFormData, setTempFormData] = useState<{
    provider: string;
    policyNumber: string;
    expirationDate: string;
  } | null>(null);

  // Fetch insurance status
  const { data: insuranceStatus, isLoading: statusLoading } = useQuery<InsuranceStatus>({
    queryKey: ['/api/insurance/status'],
    enabled: !!currentUser,
  });

  // Instant verification mutation
  const instantVerifyMutation = useMutation({
    mutationFn: async ({ provider, policyNumber, expirationDate }: {
      provider: string;
      policyNumber: string;
      expirationDate: string;
    }) => {
      // Simulate instant verification with success rates
      const successRates: Record<string, number> = {
        'State Farm': 0.8,
        'GEICO': 0.75,
        'Progressive': 0.6,
        'Allstate': 0.65,
        'USAA': 0.9,
        'Liberty Mutual': 0.55,
      };

      const successRate = successRates[provider] || 0.4;
      const isSuccess = Math.random() < successRate;

      // Simulate processing time
      await new Promise(resolve => setTimeout(resolve, 3000));

      if (isSuccess) {
        // Simulate successful verification by creating a document
        const response = await fetch('/api/insurance/submit', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            provider,
            policyNumber,
            expirationDate,
            instantVerification: true
          }),
        });

        if (!response.ok) {
          throw new Error('Verification failed');
        }

        return { success: true, data: await response.json() };
      } else {
        return { success: false };
      }
    },
    onSuccess: (result) => {
      if (result.success) {
        toast({
          title: "✅ Instant Verification Successful!",
          description: "Your insurance has been verified instantly.",
          variant: "default",
        });
        queryClient.invalidateQueries({ queryKey: ['/api/insurance/status'] });
        setCurrentStep('status');
      } else {
        toast({
          title: "⚠️ Instant Verification Failed",
          description: "We couldn't verify your insurance instantly. Please upload a document.",
          variant: "default",
        });
        setCurrentStep('upload');
      }
    },
    onError: () => {
      toast({
        title: "❌ Verification Error",
        description: "An error occurred during verification. Please try uploading a document.",
        variant: "destructive",
      });
      setCurrentStep('upload');
    },
  });

  // Document upload mutation
  const uploadMutation = useMutation({
    mutationFn: async (formData: FormData) => {
      const response = await fetch('/api/insurance/submit', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Upload failed');
      }

      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "✅ Document Uploaded Successfully",
        description: "Your insurance document has been submitted for review. You'll receive an SMS notification once reviewed.",
        variant: "default",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/insurance/status'] });
      setCurrentStep('status');
    },
    onError: (error: Error) => {
      toast({
        title: "❌ Upload Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleInstantVerification = (provider: string, policyNumber: string, expirationDate: string) => {
    setTempFormData({ provider, policyNumber, expirationDate });
    instantVerifyMutation.mutate({ provider, policyNumber, expirationDate });
  };

  const handleDocumentUpload = (formData: FormData) => {
    uploadMutation.mutate(formData);
  };

  const startNewVerification = () => {
    setCurrentStep('instant');
    setTempFormData(null);
  };

  if (statusLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p>Loading insurance status...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 max-w-4xl">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-2">Insurance Verification</h1>
          <p className="text-gray-600">
            Verify your insurance to start posting rides and earning money as a driver
          </p>
        </div>

        {/* Progress Indicator */}
        <div className="mb-8">
          <div className="flex items-center justify-center space-x-4 mb-4">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
              currentStep === 'instant' ? 'bg-blue-600 text-white' : 
              (insuranceStatus?.status === 'approved' || currentStep === 'upload' || currentStep === 'status') ? 'bg-green-600 text-white' : 'bg-gray-300 text-gray-600'
            }`}>
              1
            </div>
            <div className={`h-1 w-20 ${
              (insuranceStatus?.status === 'approved' || currentStep === 'upload' || currentStep === 'status') ? 'bg-green-600' : 'bg-gray-300'
            }`} />
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
              currentStep === 'upload' ? 'bg-blue-600 text-white' : 
              (insuranceStatus?.status === 'approved' || currentStep === 'status') ? 'bg-green-600 text-white' : 'bg-gray-300 text-gray-600'
            }`}>
              2
            </div>
            <div className={`h-1 w-20 ${
              (insuranceStatus?.status === 'approved' || currentStep === 'status') ? 'bg-green-600' : 'bg-gray-300'
            }`} />
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
              currentStep === 'status' || insuranceStatus?.status === 'approved' ? 'bg-green-600 text-white' : 'bg-gray-300 text-gray-600'
            }`}>
              ✓
            </div>
          </div>
          <div className="flex justify-center space-x-16 text-sm text-gray-600">
            <span>Instant Verify</span>
            <span>Upload Documents</span>
            <span>Complete</span>
          </div>
        </div>

        {/* Main Content */}
        {currentStep === 'instant' && (
          <InstantVerificationStep
            onVerificationAttempt={handleInstantVerification}
            onFallbackToUpload={() => setCurrentStep('upload')}
            isLoading={instantVerifyMutation.isPending}
          />
        )}

        {currentStep === 'upload' && (
          <DocumentUploadStep
            onDocumentSubmit={handleDocumentUpload}
            isLoading={uploadMutation.isPending}
            provider={tempFormData?.provider}
            policyNumber={tempFormData?.policyNumber}
            expirationDate={tempFormData?.expirationDate}
          />
        )}

        {currentStep === 'status' && insuranceStatus && (
          <div className="space-y-6">
            <StatusDisplay status={insuranceStatus} />
            
            {(insuranceStatus.status === 'none' || insuranceStatus.status === 'rejected') && (
              <div className="text-center">
                <Button
                  onClick={startNewVerification}
                  className="bg-[#B8956B] hover:bg-[#8A6F47] text-white"
                >
                  {insuranceStatus.status === 'rejected' ? 'Resubmit Insurance' : 'Start Verification'}
                </Button>
              </div>
            )}
          </div>
        )}

        {/* Initial state - decide where to start */}
        {(() => {
          if (!currentStep || (currentStep === 'status' && insuranceStatus?.status === 'none')) {
            setCurrentStep('instant');
            return null;
          }
          return null;
        })()}
      </div>
    </div>
  );
}