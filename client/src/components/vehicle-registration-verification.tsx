import React, { useState, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Upload, FileText, CheckCircle, Clock, XCircle, AlertCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/use-auth-fixed';
import { auth } from '@/lib/firebase';

// Vehicle makes and models data
const VEHICLE_MAKES = [
  'Acura', 'Audi', 'BMW', 'Buick', 'Cadillac', 'Chevrolet', 'Chrysler', 'Dodge', 
  'Ford', 'GMC', 'Honda', 'Hyundai', 'Infiniti', 'Jeep', 'Kia', 'Lexus', 
  'Lincoln', 'Mazda', 'Mercedes-Benz', 'Mitsubishi', 'Nissan', 'Ram', 'Subaru', 
  'Tesla', 'Toyota', 'Volkswagen', 'Volvo'
];

const vehicleSchema = z.object({
  vehicleMake: z.string().min(1, 'Vehicle make is required'),
  vehicleModel: z.string().min(1, 'Vehicle model is required'),
  vehicleYear: z.string().min(4, 'Vehicle year is required'),
  licensePlate: z.string().min(1, 'License plate is required').max(10, 'License plate too long'),
  registrationDocument: z.any().refine((files) => files?.length > 0, 'Registration document is required')
});

type VehicleFormData = z.infer<typeof vehicleSchema>;

interface VehicleRegistrationProps {
  currentVehicle?: {
    vehicleMake?: string;
    vehicleModel?: string;
    vehicleYear?: number;
    licensePlate?: string;
    vehicleRegistrationVerified?: boolean;
    vehicleRegistrationStatus?: string;
    vehicleRegistrationRejectionReason?: string;
  };
  onUpdate?: () => void;
}

export default function VehicleRegistrationVerification({ currentVehicle, onUpdate }: VehicleRegistrationProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const { currentUser } = useAuth();

  const form = useForm<VehicleFormData>({
    resolver: zodResolver(vehicleSchema),
    defaultValues: {
      vehicleMake: currentVehicle?.vehicleMake || '',
      vehicleModel: currentVehicle?.vehicleModel || '',
      vehicleYear: currentVehicle?.vehicleYear?.toString() || '',
      licensePlate: currentVehicle?.licensePlate || '',
      registrationDocument: null
    }
  });

  // Generate years from 1980 to current year + 1
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: currentYear - 1979 }, (_, i) => currentYear - i);

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
        setUploadedFile(file);
        form.setValue('registrationDocument', e.dataTransfer.files);
      }
    }
  };

  const validateFile = (file: File): boolean => {
    const validTypes = ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf'];
    const maxSize = 10 * 1024 * 1024; // 10MB

    if (!validTypes.includes(file.type)) {
      toast({
        title: "Invalid file type",
        description: "Please upload a JPEG, PNG, or PDF file.",
        variant: "destructive"
      });
      return false;
    }

    if (file.size > maxSize) {
      toast({
        title: "File too large",
        description: "Please upload a file smaller than 10MB.",
        variant: "destructive"
      });
      return false;
    }

    return true;
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (validateFile(file)) {
        setUploadedFile(file);
        form.setValue('registrationDocument', e.target.files);
      }
    }
  };

  const removeFile = () => {
    setUploadedFile(null);
    form.setValue('registrationDocument', null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const onSubmit = async (data: VehicleFormData) => {
    if (!uploadedFile) {
      toast({
        title: "Document required",
        description: "Please upload your vehicle registration document.",
        variant: "destructive"
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const formData = new FormData();
      formData.append('vehicleMake', data.vehicleMake);
      formData.append('vehicleModel', data.vehicleModel);
      formData.append('vehicleYear', data.vehicleYear);
      formData.append('licensePlate', data.licensePlate.toUpperCase());
      formData.append('registrationDocument', uploadedFile);

      if (!currentUser) {
        throw new Error('Authentication required. Please log in again.');
      }
      
      const token = await currentUser.getIdToken();

      const response = await fetch('/api/users/vehicle-registration', {
        method: 'POST',
        body: formData,
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to submit vehicle registration');
      }

      toast({
        title: "Vehicle registration submitted",
        description: "Your vehicle registration is now being reviewed. You'll be notified once it's verified.",
        variant: "default"
      });

      // Reset form
      form.reset();
      setUploadedFile(null);
      
      // Trigger parent component refresh
      if (onUpdate) {
        onUpdate();
      }

    } catch (error: any) {
      toast({
        title: "Submission failed",
        description: error.message || "Failed to submit vehicle registration. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Show verification status if vehicle is already registered
  if (currentVehicle?.vehicleMake && currentVehicle?.vehicleModel) {
    const status = currentVehicle.vehicleRegistrationStatus || 'none';
    
    return (
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                Vehicle Registration
                {status === 'approved' && <CheckCircle className="w-5 h-5 text-green-600" />}
                {status === 'pending' && <Clock className="w-5 h-5 text-yellow-600" />}
                {status === 'rejected' && <XCircle className="w-5 h-5 text-red-600" />}
              </CardTitle>
              <CardDescription>
                Vehicle registration verification status
              </CardDescription>
            </div>
            <Badge variant={
              status === 'approved' ? 'default' : 
              status === 'pending' ? 'secondary' : 
              status === 'rejected' ? 'destructive' : 'outline'
            }>
              {status === 'approved' ? 'Verified' : 
               status === 'pending' ? 'Under Review' : 
               status === 'rejected' ? 'Rejected' : 'Not Submitted'}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-sm font-medium text-gray-600">Vehicle</Label>
              <p className="text-sm">
                {currentVehicle.vehicleYear} {currentVehicle.vehicleMake} {currentVehicle.vehicleModel}
              </p>
            </div>
            <div>
              <Label className="text-sm font-medium text-gray-600">License Plate</Label>
              <p className="text-sm font-mono bg-gray-100 px-2 py-1 rounded">
                {currentVehicle.licensePlate}
              </p>
            </div>
          </div>

          {status === 'rejected' && currentVehicle.vehicleRegistrationRejectionReason && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
                <div>
                  <h4 className="font-medium text-red-800">Verification Failed</h4>
                  <p className="text-sm text-red-700 mt-1">
                    {currentVehicle.vehicleRegistrationRejectionReason}
                  </p>
                </div>
              </div>
            </div>
          )}

          {status === 'pending' && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <Clock className="w-5 h-5 text-yellow-600 mt-0.5 flex-shrink-0" />
                <div>
                  <h4 className="font-medium text-yellow-800">Under Review</h4>
                  <p className="text-sm text-yellow-700 mt-1">
                    Your vehicle registration is being verified. This typically takes 1-2 business days.
                  </p>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Vehicle Registration Verification</CardTitle>
        <CardDescription>
          Upload your vehicle registration document to verify your vehicle information
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          {/* Vehicle Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="vehicleMake">Vehicle Make *</Label>
              <Select 
                value={form.watch('vehicleMake')} 
                onValueChange={(value) => form.setValue('vehicleMake', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select make" />
                </SelectTrigger>
                <SelectContent>
                  {VEHICLE_MAKES.map((make) => (
                    <SelectItem key={make} value={make}>
                      {make}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {form.formState.errors.vehicleMake && (
                <p className="text-sm text-red-600">{form.formState.errors.vehicleMake.message?.toString()}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="vehicleModel">Vehicle Model *</Label>
              <Input
                {...form.register('vehicleModel')}
                placeholder="e.g., Accord, Camry, F-150"
              />
              {form.formState.errors.vehicleModel && (
                <p className="text-sm text-red-600">{form.formState.errors.vehicleModel.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="vehicleYear">Vehicle Year *</Label>
              <Select 
                value={form.watch('vehicleYear')} 
                onValueChange={(value) => form.setValue('vehicleYear', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select year" />
                </SelectTrigger>
                <SelectContent>
                  {years.map((year) => (
                    <SelectItem key={year} value={year.toString()}>
                      {year}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {form.formState.errors.vehicleYear && (
                <p className="text-sm text-red-600">{form.formState.errors.vehicleYear.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="licensePlate">License Plate *</Label>
              <Input
                {...form.register('licensePlate')}
                placeholder="e.g., ABC-123"
                className="font-mono"
                style={{ textTransform: 'uppercase' }}
              />
              {form.formState.errors.licensePlate && (
                <p className="text-sm text-red-600">{form.formState.errors.licensePlate.message}</p>
              )}
            </div>
          </div>

          {/* Document Upload */}
          <div className="space-y-2">
            <Label>Vehicle Registration Document *</Label>
            <p className="text-sm text-gray-600">
              Upload a clear photo or PDF of your vehicle registration document
            </p>
            
            <div
              className={`relative border-2 border-dashed rounded-lg p-6 transition-colors ${
                dragActive ? 'border-blue-400 bg-blue-50' : 'border-gray-300'
              } ${uploadedFile ? 'border-green-400 bg-green-50' : ''}`}
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
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              />
              
              {uploadedFile ? (
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <FileText className="w-8 h-8 text-green-600" />
                    <div>
                      <p className="font-medium text-green-800">{uploadedFile.name}</p>
                      <p className="text-sm text-green-600">
                        {(uploadedFile.size / 1024 / 1024).toFixed(2)} MB
                      </p>
                    </div>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={removeFile}
                  >
                    Remove
                  </Button>
                </div>
              ) : (
                <div className="text-center">
                  <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">
                    Drag and drop your registration document here, or{' '}
                    <span className="text-blue-600 underline">click to browse</span>
                  </p>
                  <p className="text-sm text-gray-500 mt-2">
                    Supports JPEG, PNG, and PDF files up to 10MB
                  </p>
                </div>
              )}
            </div>
            
            {form.formState.errors.registrationDocument?.message && (
              <p className="text-sm text-red-600">{form.formState.errors.registrationDocument.message}</p>
            )}
          </div>

          {/* Security Notice */}
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <CheckCircle className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
              <div>
                <h4 className="font-medium text-green-800">Secure Document Handling</h4>
                <p className="text-sm text-green-700 mt-1">
                  Your registration document is encrypted and securely stored. Trek staff will verify your 
                  vehicle information and cross-reference it with your insurance policy for accuracy.
                </p>
              </div>
            </div>
          </div>

          <Button
            type="submit"
            disabled={isSubmitting || !uploadedFile}
            className="w-full bg-[#B8956B] hover:bg-[#8A6F47] text-white"
          >
            {isSubmitting ? 'Submitting...' : 'Submit Vehicle Registration'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}