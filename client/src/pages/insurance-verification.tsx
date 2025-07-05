import { useState, useRef } from "react";
import { useAuth } from "@/hooks/use-auth-fixed";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
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

const StatusDisplay = ({ status }: { status: InsuranceStatus }) => {
  const getStatusIcon = () => {
    switch (status.status) {
      case 'approved':
        return <CheckCircle className="w-8 h-8 text-green-600" />;
      case 'rejected':
        return <XCircle className="w-8 h-8 text-red-600" />;
      case 'pending':
        return <Clock className="w-8 h-8 text-blue-600" />;
      default:
        return <AlertTriangle className="w-8 h-8 text-gray-600" />;
    }
  };

  const getStatusColor = () => {
    switch (status.status) {
      case 'approved':
        return 'bg-green-100 text-green-800 border-green-300';
      case 'rejected':
        return 'bg-red-100 text-red-800 border-red-300';
      case 'pending':
        return 'bg-blue-100 text-blue-800 border-blue-300';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  const getStatusText = () => {
    switch (status.status) {
      case 'approved':
        return 'Verified';
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
        <CardTitle className="text-xl">Insurance Status</CardTitle>
        <Badge className={`mx-auto px-4 py-2 text-sm font-medium rounded-full border ${getStatusColor()}`}>
          {getStatusText()}
        </Badge>
      </CardHeader>
      <CardContent className="space-y-4">
        {status.provider && (
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="font-medium text-gray-600">Provider:</span>
              <p className="mt-1">{status.provider}</p>
            </div>
            <div>
              <span className="font-medium text-gray-600">Policy Number:</span>
              <p className="mt-1">{status.policyNumber}</p>
            </div>
          </div>
        )}
        
        {status.status === 'rejected' && status.document?.rejectionReason && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
            <h4 className="font-medium text-red-800 mb-2">Rejection Reason:</h4>
            <p className="text-red-700 text-sm">{status.document.rejectionReason}</p>
          </div>
        )}
        
        {status.status === 'pending' && (
          <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-blue-700 text-sm">
              Your insurance information is being reviewed. You'll receive an update within 24-48 hours.
            </p>
          </div>
        )}
        
        {status.status === 'approved' && status.verificationDate && (
          <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
            <p className="text-green-700 text-sm">
              Verified on {new Date(status.verificationDate).toLocaleDateString()}
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
  const [provider, setProvider] = useState('');
  const [policyNumber, setPolicyNumber] = useState('');
  const [expirationDate, setExpirationDate] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Fetch insurance status
  const { data: insuranceStatus, isLoading: statusLoading } = useQuery<InsuranceStatus>({
    queryKey: ['/api/insurance/status'],
    enabled: !!currentUser,
  });

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
      toast({
        title: "✅ Insurance Submitted Successfully",
        description: "Your insurance is now being verified. You'll receive an update within 24-48 hours.",
        variant: "default",
      });
      // Don't reset form - let the status display take over
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
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      if (validateFile(file)) {
        setSelectedFile(file);
      }
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (validateFile(file)) {
        setSelectedFile(file);
      }
    }
  };

  const validateFile = (file: File) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'application/pdf'];
    const maxSize = 10 * 1024 * 1024; // 10MB

    if (!allowedTypes.includes(file.type)) {
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

  // Show status if already submitted (including after successful submission)
  if (insuranceStatus && (insuranceStatus.status === 'pending' || insuranceStatus.status === 'approved' || insuranceStatus.status === 'rejected')) {
    return (
      <div className="container mx-auto p-6 max-w-4xl">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-2">Driver Insurance Verification</h1>
          <p className="text-gray-600">
            All drivers must have verified insurance to ensure passenger safety and legal compliance.
          </p>
        </div>

        <StatusDisplay status={insuranceStatus} />
        
        {insuranceStatus.status === 'rejected' && (
          <div className="text-center mt-6">
            <Button
              onClick={startNewVerification}
              className="bg-[#B8956B] hover:bg-[#8A6F47] text-white"
            >
              {insuranceStatus.status === 'rejected' ? 'Resubmit Insurance' : 'Start Verification'}
            </Button>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold mb-2">Driver Insurance Verification</h1>
        <p className="text-gray-600">
          All drivers must have verified insurance to ensure passenger safety and legal compliance.
        </p>
      </div>

      {/* Insurance Required Alert */}
      <div className="mb-8 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start space-x-3">
        <AlertTriangle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
        <div>
          <h3 className="font-medium text-red-800">Insurance Required</h3>
          <p className="text-red-700 text-sm mt-1">
            You must provide valid insurance information to post rides
          </p>
        </div>
      </div>

      <Card className="w-full max-w-2xl mx-auto">
        <CardHeader className="text-center">
          <CardTitle className="text-xl">Submit Insurance Information</CardTitle>
          <CardDescription>
            Provide your policy details and upload your insurance document
          </CardDescription>
        </CardHeader>
        <CardContent>
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
    </div>
  );
}