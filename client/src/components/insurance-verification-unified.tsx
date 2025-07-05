import { useState, useRef } from "react";
import { useAuth } from "@/hooks/use-auth-fixed";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Upload, FileText, CheckCircle, XCircle, Clock, AlertTriangle, Shield } from "lucide-react";

interface InsuranceStatus {
  status: 'none' | 'pending' | 'approved' | 'rejected';
  verified: boolean;
  provider?: string | null;
  policyNumber?: string | null;
  expirationDate?: string | null;
  verificationDate?: string | null;
  rejectionReason?: string | null;
}

interface InsuranceVerificationUnifiedProps {
  currentInsurance?: {
    insuranceProvider: string | null;
    insurancePolicyNumber: string | null;
    insuranceExpirationDate: string | null;
    insuranceVerified: boolean;
    insuranceStatus: string;
    insuranceRejectionReason?: string | null;
  };
  onUpdate: () => void;
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

const StatusDisplay = ({ status }: { status: InsuranceStatus }) => {
  const getStatusIcon = () => {
    switch (status.status) {
      case 'approved':
        return <CheckCircle className="w-8 h-8 text-green-600" />;
      case 'rejected':
        return <XCircle className="w-8 h-8 text-red-600" />;
      case 'pending':
        return <Clock className="w-8 h-8 text-yellow-600" />;
      default:
        return <AlertTriangle className="w-8 h-8 text-gray-400" />;
    }
  };

  const getStatusColor = () => {
    switch (status.status) {
      case 'approved': return 'bg-green-100 text-green-800 border-green-300';
      case 'rejected': return 'bg-red-100 text-red-800 border-red-300';
      case 'pending': return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      default: return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  const getStatusText = () => {
    switch (status.status) {
      case 'approved': return 'Verified';
      case 'rejected': return 'Rejected';
      case 'pending': return 'Being Verified';
      default: return 'Not Submitted';
    }
  };

  const getStatusMessage = () => {
    switch (status.status) {
      case 'approved':
        return 'Your insurance has been verified! You can now post rides.';
      case 'rejected':
        return status.rejectionReason || 'Your insurance was rejected. Please check your information and try again.';
      case 'pending':
        return 'Your insurance is being verified. You\'ll receive an update within 24-48 hours.';
      default:
        return 'Please submit your insurance information to post rides.';
    }
  };

  return (
    <div className="text-center space-y-4">
      <div className="flex justify-center">
        {getStatusIcon()}
      </div>
      <div>
        <Badge className={`${getStatusColor()} px-4 py-2 text-lg font-semibold`}>
          {getStatusText()}
        </Badge>
      </div>
      <p className="text-gray-600 max-w-md mx-auto">
        {getStatusMessage()}
      </p>
      {status.provider && (
        <div className="mt-4 space-y-2">
          <p className="text-sm text-gray-500">Insurance Details:</p>
          <div className="bg-gray-50 p-3 rounded-lg text-sm">
            <p><strong>Provider:</strong> {status.provider}</p>
            <p><strong>Policy Number:</strong> {status.policyNumber}</p>
            <p><strong>Expiration Date:</strong> {status.expirationDate ? new Date(status.expirationDate).toLocaleDateString() : 'N/A'}</p>
          </div>
        </div>
      )}
    </div>
  );
};

export function InsuranceVerificationUnified({ currentInsurance, onUpdate }: InsuranceVerificationUnifiedProps) {
  const { currentUser } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Form state
  const [provider, setProvider] = useState('');
  const [policyNumber, setPolicyNumber] = useState('');
  const [expirationDate, setExpirationDate] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [dragActive, setDragActive] = useState(false);

  // Create insurance status from current insurance data
  const insuranceStatus: InsuranceStatus = {
    status: currentInsurance?.insuranceStatus as ('none' | 'pending' | 'approved' | 'rejected') || 'none',
    verified: currentInsurance?.insuranceVerified || false,
    provider: currentInsurance?.insuranceProvider,
    policyNumber: currentInsurance?.insurancePolicyNumber,
    expirationDate: currentInsurance?.insuranceExpirationDate,
    rejectionReason: currentInsurance?.insuranceRejectionReason
  };

  // Combined submission mutation
  const submitMutation = useMutation({
    mutationFn: async (formData: FormData) => {
      const response = await fetch('/api/insurance/submit', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${await currentUser?.getIdToken()}`,
        },
        body: formData,
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Submission failed');
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/insurance/status'] });
      onUpdate(); // Refresh profile data
      toast({
        title: "✅ Insurance Submitted Successfully",
        description: "Your insurance is now being verified. You'll receive an update within 24-48 hours.",
        variant: "default",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "❌ Submission Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!provider || !policyNumber || !expirationDate || !selectedFile) {
      toast({
        title: "❌ Missing Information",
        description: "Please fill in all policy details and upload your insurance document.",
        variant: "destructive",
      });
      return;
    }

    const formData = new FormData();
    formData.append('provider', provider);
    formData.append('policyNumber', policyNumber);
    formData.append('expirationDate', expirationDate);
    formData.append('insuranceDocument', selectedFile);

    submitMutation.mutate(formData);
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    const files = Array.from(e.dataTransfer.files);
    const file = files[0];
    
    if (file && validateFile(file)) {
      setSelectedFile(file);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && validateFile(file)) {
      setSelectedFile(file);
    }
  };

  const validateFile = (file: File) => {
    const validTypes = ['image/jpeg', 'image/png', 'application/pdf'];
    const maxSize = 10 * 1024 * 1024; // 10MB

    if (!validTypes.includes(file.type)) {
      toast({
        title: "❌ Invalid File Type",
        description: "Please upload a JPEG, PNG, or PDF file.",
        variant: "destructive",
      });
      return false;
    }

    if (file.size > maxSize) {
      toast({
        title: "❌ File Too Large",
        description: "Please upload a file smaller than 10MB.",
        variant: "destructive",
      });
      return false;
    }

    return true;
  };

  const removeFile = () => {
    setSelectedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const startNewVerification = () => {
    setProvider('');
    setPolicyNumber('');
    setExpirationDate('');
    setSelectedFile(null);
  };

  // Show status if already submitted (including after successful submission)
  if (insuranceStatus && (insuranceStatus.status === 'pending' || insuranceStatus.status === 'approved' || insuranceStatus.status === 'rejected')) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Shield className="mr-2 h-5 w-5" />
            Driver Insurance Verification
          </CardTitle>
          <CardDescription>
            All drivers must have verified insurance to ensure passenger safety and legal compliance.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <StatusDisplay status={insuranceStatus} />
          
          {insuranceStatus.status === 'rejected' && (
            <div className="text-center mt-6">
              <Button
                onClick={startNewVerification}
                className="bg-[#B8956B] hover:bg-[#8A6F47] text-white"
              >
                Resubmit Insurance
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <Shield className="mr-2 h-5 w-5" />
          Driver Insurance Verification
        </CardTitle>
        <CardDescription>
          All drivers must have verified insurance to ensure passenger safety and legal compliance.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {/* Insurance Required Alert */}
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start space-x-3">
          <AlertTriangle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
          <div>
            <h3 className="font-medium text-red-800">Insurance Required</h3>
            <p className="text-red-700 text-sm mt-1">
              You must provide valid insurance information to post rides
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Policy Information Section */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Policy Information</h3>
            
            {/* Insurance Provider */}
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

            {/* Policy Number */}
            <div>
              <Label htmlFor="policyNumber">Policy Number</Label>
              <Input
                id="policyNumber"
                value={policyNumber}
                onChange={(e) => setPolicyNumber(e.target.value)}
                placeholder="Enter your insurance policy number"
                disabled={submitMutation.isPending}
              />
            </div>

            {/* Expiration Date */}
            <div>
              <Label htmlFor="expirationDate">Policy Expiration Date</Label>
              <Input
                id="expirationDate"
                type="date"
                value={expirationDate}
                onChange={(e) => setExpirationDate(e.target.value)}
                disabled={submitMutation.isPending}
                min={new Date().toISOString().split('T')[0]}
              />
            </div>
          </div>

          {/* Document Upload Section */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Insurance Document</h3>
            <p className="text-sm text-gray-600">
              Upload your insurance card or policy document (JPEG, PNG, or PDF, max 10MB)
            </p>
            
            <div
              className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
                dragActive 
                  ? 'border-blue-500 bg-blue-50' 
                  : selectedFile 
                    ? 'border-green-500 bg-green-50' 
                    : 'border-gray-300 hover:border-gray-400'
              }`}
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".jpg,.jpeg,.png,.pdf"
                onChange={handleFileChange}
                className="hidden"
                disabled={submitMutation.isPending}
              />
              
              {selectedFile ? (
                <div className="space-y-3">
                  <FileText className="w-12 h-12 text-green-600 mx-auto" />
                  <div>
                    <p className="font-medium text-green-800">{selectedFile.name}</p>
                    <p className="text-sm text-green-600">
                      {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB
                    </p>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={removeFile}
                    disabled={submitMutation.isPending}
                  >
                    Remove File
                  </Button>
                </div>
              ) : (
                <div className="space-y-3">
                  <Upload className="w-12 h-12 text-gray-400 mx-auto" />
                  <div>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={submitMutation.isPending}
                    >
                      Choose File
                    </Button>
                    <p className="text-sm text-gray-500 mt-2">
                      or drag and drop your file here
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Submit Button */}
          <Button 
            type="submit" 
            disabled={!provider || !policyNumber || !expirationDate || !selectedFile || submitMutation.isPending}
            className="w-full bg-[#B8956B] hover:bg-[#8A6F47] text-white"
          >
            {submitMutation.isPending ? (
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Submitting for Verification...
              </div>
            ) : (
              'Submit Insurance for Verification'
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}