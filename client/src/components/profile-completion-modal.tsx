import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useToast } from '@/hooks/use-toast';

const profileSchema = z.object({
  phone: z.string().optional(),
  instagram: z.string().optional(),
  snapchat: z.string().optional(),
});

type ProfileFormValues = z.infer<typeof profileSchema>;

interface ProfileCompletionModalProps {
  isOpen: boolean;
  onComplete: (data: ProfileFormValues) => void;
  onSkip: () => void;
  userEmail: string;
  userName: string;
}

export default function ProfileCompletionModal({ 
  isOpen, 
  onComplete, 
  onSkip, 
  userEmail, 
  userName 
}: ProfileCompletionModalProps) {
  const { toast } = useToast();
  
  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      phone: '',
      instagram: '',
      snapchat: '',
    },
  });

  const handleSubmit = (values: ProfileFormValues) => {
    // Filter out empty strings
    const cleanedValues = Object.fromEntries(
      Object.entries(values).filter(([_, value]) => value && value.trim() !== '')
    );
    
    onComplete(cleanedValues);
    
    toast({
      title: "Profile Updated!",
      description: "Your contact information has been saved successfully.",
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={() => {}}>
      <DialogContent className="sm:max-w-md" onPointerDownOutside={(e) => e.preventDefault()}>
        <DialogHeader>
          <DialogTitle className="text-xl text-primary">Complete Your Profile</DialogTitle>
          <DialogDescription>
            Welcome to GatorLift, {userName}! Add your contact info so other students can easily reach you for rides.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
            <p className="text-sm text-blue-800">
              <strong>UF Email:</strong> {userEmail}
            </p>
            <p className="text-xs text-blue-600 mt-1">
              Your UF email will be used as a backup contact method
            </p>
          </div>
          
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Phone Number (Recommended)</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="(555) 123-4567" 
                        {...field}
                        className="h-12 rounded-md border-gray-200"
                      />
                    </FormControl>
                    <p className="text-xs text-gray-500">Primary contact method for ride coordination</p>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="instagram"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Instagram Username (Optional)</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="your_username" 
                        {...field}
                        className="h-12 rounded-md border-gray-200"
                      />
                    </FormControl>
                    <p className="text-xs text-gray-500">Don't include the @ symbol</p>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="snapchat"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Snapchat Username (Optional)</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="your_snapchat" 
                        {...field}
                        className="h-12 rounded-md border-gray-200"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <div className="flex space-x-3 pt-4">
                <Button 
                  type="submit" 
                  className="flex-1 h-12 bg-primary hover:bg-primary/90"
                >
                  Save Contact Info
                </Button>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={onSkip}
                  className="h-12 px-6"
                >
                  Skip for Now
                </Button>
              </div>
            </form>
          </Form>
          
          <p className="text-xs text-center text-gray-500">
            You can always update this information later in your profile settings
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}