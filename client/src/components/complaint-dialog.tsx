import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth-fixed";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { AlertTriangle, Send } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface ComplaintDialogProps {
  rideId: number;
  trigger?: React.ReactNode;
}

export function ComplaintDialog({ rideId, trigger }: ComplaintDialogProps) {
  const [open, setOpen] = useState(false);
  const [subject, setSubject] = useState("");
  const [description, setDescription] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  
  const { currentUser } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const createComplaintMutation = useMutation({
    mutationFn: async (complaintData: {
      reporterId: string;
      rideId: number;
      subject: string;
      description: string;
      contactEmail?: string;
    }) => {
      const response = await fetch('/api/complaints', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${await currentUser?.getIdToken()}`
        },
        body: JSON.stringify(complaintData)
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to submit complaint');
      }

      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Complaint Submitted",
        description: "Your complaint has been submitted successfully. Our support team will review it shortly.",
        variant: "default",
      });
      
      // Reset form
      setSubject("");
      setDescription("");
      setContactEmail("");
      setOpen(false);
      
      // Invalidate any relevant queries
      queryClient.invalidateQueries({ queryKey: ['/api/complaints'] });
    },
    onError: (error: Error) => {
      toast({
        title: "Submission Failed",
        description: error.message || "Failed to submit complaint. Please try again.",
        variant: "destructive",
      });
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!currentUser) {
      toast({
        title: "Authentication Required",
        description: "You must be logged in to submit a complaint.",
        variant: "destructive",
      });
      return;
    }

    if (!subject.trim() || !description.trim()) {
      toast({
        title: "Missing Information",
        description: "Please provide both a subject and description for your complaint.",
        variant: "destructive",
      });
      return;
    }

    createComplaintMutation.mutate({
      reporterId: currentUser.uid,
      rideId,
      subject: subject.trim(),
      description: description.trim(),
      contactEmail: contactEmail.trim() || undefined
    });
  };

  const defaultTrigger = (
    <Button 
      variant="outline" 
      size="sm"
      className="bg-red-50 border-red-200 text-red-700 hover:bg-red-100 hover:border-red-300"
    >
      <AlertTriangle className="w-4 h-4 mr-2" />
      Report Issue
    </Button>
  );

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || defaultTrigger}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-red-600" />
            Report an Issue
          </DialogTitle>
          <DialogDescription>
            Help us improve your experience by reporting any issues with this ride. 
            Our support team will review your complaint and follow up if needed.
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="subject">Subject *</Label>
            <Input
              id="subject"
              placeholder="Brief description of the issue"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              maxLength={100}
              required
            />
            <p className="text-xs text-gray-500">
              {subject.length}/100 characters
            </p>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="description">Description *</Label>
            <Textarea
              id="description"
              placeholder="Please provide detailed information about the issue, including what happened, when it occurred, and any other relevant details that would help us understand the situation."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              maxLength={1000}
              rows={4}
              required
            />
            <p className="text-xs text-gray-500">
              {description.length}/1000 characters
            </p>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="contactEmail">Alternative Contact Email (Optional)</Label>
            <Input
              id="contactEmail"
              type="email"
              placeholder="your.email@example.com"
              value={contactEmail}
              onChange={(e) => setContactEmail(e.target.value)}
            />
            <p className="text-xs text-gray-500">
              If you'd like us to contact you at a different email address
            </p>
          </div>
          
          <DialogFooter>
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => setOpen(false)}
              disabled={createComplaintMutation.isPending}
            >
              Cancel
            </Button>
            <Button 
              type="submit"
              disabled={createComplaintMutation.isPending || !subject.trim() || !description.trim()}
              className="bg-red-600 hover:bg-red-700"
            >
              {createComplaintMutation.isPending ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                  Submitting...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4 mr-2" />
                  Submit Complaint
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}