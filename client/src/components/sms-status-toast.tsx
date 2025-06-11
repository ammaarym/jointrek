import { useToast } from "@/hooks/use-toast";
import { useEffect } from "react";

interface SMSStatus {
  sent: boolean;
  reason: string;
}

interface SMSStatusToastProps {
  smsStatus?: SMSStatus;
  type: 'request' | 'approval';
}

export function SMSStatusToast({ smsStatus, type }: SMSStatusToastProps) {
  const { toast } = useToast();

  useEffect(() => {
    if (smsStatus) {
      const messageType = type === 'request' ? 'driver' : 'passenger';
      
      if (smsStatus.sent) {
        toast({
          title: "📱 SMS Sent!",
          description: `Notification sent to ${messageType}: ${smsStatus.reason}`,
          duration: 4000,
        });
      } else {
        toast({
          title: "📱 SMS Not Sent",
          description: `Could not notify ${messageType}: ${smsStatus.reason}`,
          variant: "destructive",
          duration: 4000,
        });
      }
    }
  }, [smsStatus, type, toast]);

  return null;
}