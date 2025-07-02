import { useState } from 'react';
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
import { ShieldCheck, AlertTriangle, FileText, Calendar } from 'lucide-react';

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

export function InsuranceVerification({ currentInsurance, onUpdate }: InsuranceVerificationProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  const { currentUser } = useAuth();

  const form = useForm<InsuranceFormData>({
    resolver: zodResolver(insuranceSchema),
    defaultValues: {
      insuranceProvider: currentInsurance?.insuranceProvider || '',
      insurancePolicyNumber: currentInsurance?.insurancePolicyNumber || '',
      insuranceExpirationDate: currentInsurance?.insuranceExpirationDate 
        ? new Date(currentInsurance.insuranceExpirationDate).toISOString().split('T')[0]
        : ''
    }
  });

  const onSubmit = async (data: InsuranceFormData) => {
    try {
      setIsSubmitting(true);

      const token = await currentUser?.getIdToken();
      
      const response = await fetch('/api/users/insurance', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          insuranceProvider: data.insuranceProvider,
          insurancePolicyNumber: data.insurancePolicyNumber,
          insuranceExpirationDate: new Date(data.insuranceExpirationDate).toISOString()
        })
      });

      if (response.ok) {
        toast({
          title: "Insurance Information Submitted",
          description: "Your insurance information has been submitted for verification. This may take 24-48 hours.",
          variant: "default"
        });
        onUpdate();
      } else {
        const error = await response.json();
        throw new Error(error.message || 'Failed to submit insurance information');
      }
    } catch (error: any) {
      console.error('Error submitting insurance:', error);
      toast({
        title: "Submission Failed",
        description: error.message || "Failed to submit insurance information",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const getVerificationStatus = () => {
    if (currentInsurance?.insuranceVerified) {
      return {
        icon: <ShieldCheck className="w-5 h-5 text-green-600" />,
        title: "Insurance Verified",
        description: "Your insurance has been verified and you can post rides",
        variant: "default" as const
      };
    } else if (currentInsurance?.insuranceProvider) {
      return {
        icon: <AlertTriangle className="w-5 h-5 text-yellow-600" />,
        title: "Verification Pending",
        description: "Your insurance information is being reviewed by our team",
        variant: "default" as const
      };
    } else {
      return {
        icon: <AlertTriangle className="w-5 h-5 text-red-600" />,
        title: "Insurance Required",
        description: "You must provide valid insurance information to post rides",
        variant: "destructive" as const
      };
    }
  };

  const status = getVerificationStatus();

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ShieldCheck className="w-5 h-5" />
          Driver Insurance Verification
        </CardTitle>
        <CardDescription>
          All drivers must have verified insurance to ensure passenger safety and legal compliance.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Current Status */}
        <Alert variant={status.variant}>
          {status.icon}
          <AlertDescription>
            <div>
              <div className="font-medium">{status.title}</div>
              <div className="text-sm mt-1">{status.description}</div>
            </div>
          </AlertDescription>
        </Alert>

        {/* Current Insurance Info (if exists) */}
        {currentInsurance?.insuranceProvider && (
          <div className="p-4 border rounded-lg bg-gray-50">
            <h4 className="font-medium mb-3 flex items-center gap-2">
              <FileText className="w-4 h-4" />
              Current Insurance Information
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div>
                <Label className="text-xs text-gray-500">Provider</Label>
                <p className="font-medium">{currentInsurance.insuranceProvider}</p>
              </div>
              <div>
                <Label className="text-xs text-gray-500">Policy Number</Label>
                <p className="font-medium">{currentInsurance.insurancePolicyNumber}</p>
              </div>
              <div>
                <Label className="text-xs text-gray-500">Expires</Label>
                <p className="font-medium flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  {currentInsurance.insuranceExpirationDate 
                    ? new Date(currentInsurance.insuranceExpirationDate).toLocaleDateString()
                    : 'Not set'
                  }
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Insurance Form */}
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
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
                    <Input {...field} placeholder="Enter your insurance policy number" />
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
                    <Input 
                      {...field} 
                      type="date" 
                      min={new Date().toISOString().split('T')[0]}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button 
              type="submit" 
              disabled={isSubmitting}
              className="w-full"
            >
              {isSubmitting ? "Submitting..." : "Submit Insurance Information"}
            </Button>
          </form>
        </Form>

        {/* Important Notes */}
        <div className="text-xs text-gray-500 space-y-2">
          <p className="font-medium">Important Notes:</p>
          <ul className="list-disc list-inside space-y-1 ml-2">
            <li>Insurance must be current and valid for the vehicle you'll be driving</li>
            <li>Verification typically takes 24-48 hours during business days</li>
            <li>You cannot post rides until your insurance is verified</li>
            <li>Insurance information is kept confidential and secure</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}