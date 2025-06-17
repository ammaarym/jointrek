import twilio from 'twilio';

interface SMSData {
  to: string;
  message: string;
}

class TwilioService {
  private client: twilio.Twilio | null = null;
  private messagingServiceSid: string;

  constructor() {
    const accountSid = process.env.TWILIO_ACCOUNT_SID;
    const authToken = process.env.TWILIO_AUTH_TOKEN;
    this.messagingServiceSid = process.env.TWILIO_MESSAGING_SERVICE_SID || '';

    if (!accountSid || !authToken || !this.messagingServiceSid) {
      console.warn('Twilio credentials not found. SMS notifications will be disabled.');
      return;
    }

    this.client = twilio(accountSid, authToken);
  }

  async sendSMS(data: SMSData): Promise<boolean> {
    try {
      console.log('=== SMS SEND ATTEMPT ===');
      console.log('Raw phone number:', data.to);
      console.log('Message length:', data.message.length);
      console.log('Twilio client initialized:', !!this.client);
      console.log('Messaging Service SID:', this.messagingServiceSid ? 'Present' : 'Missing');
      
      if (!this.client) {
        console.error('ERROR: Twilio client not initialized. Skipping SMS.');
        return false;
      }

      // Clean phone number - remove any non-digits and ensure it starts with +1
      let phoneNumber = data.to.replace(/\D/g, '');
      console.log('Cleaned phone number (digits only):', phoneNumber);
      
      if (phoneNumber.length === 10) {
        phoneNumber = '1' + phoneNumber;
        console.log('Added country code to 10-digit number:', phoneNumber);
      }
      if (!phoneNumber.startsWith('1')) {
        phoneNumber = '1' + phoneNumber;
        console.log('Ensured country code prefix:', phoneNumber);
      }
      phoneNumber = '+' + phoneNumber;
      console.log('Final formatted phone number:', phoneNumber);

      console.log('Attempting Twilio API call...');
      const message = await this.client.messages.create({
        body: data.message,
        messagingServiceSid: this.messagingServiceSid,
        to: phoneNumber
      });

      console.log('=== SMS SUCCESS ===');
      console.log(`Message SID: ${message.sid}`);
      console.log(`Status: ${message.status}`);
      console.log(`To: ${phoneNumber}`);
      console.log('=== SMS END ===');
      return true;
    } catch (error: any) {
      console.error('=== SMS FAILED ===');
      console.error('Twilio Error Details:');
      console.error('- Code:', error.code);
      console.error('- Message:', error.message);
      console.error('- Status:', error.status);
      console.error('- More Info:', error.moreInfo);
      console.error('- Full Error:', error);
      console.error('=== SMS ERROR END ===');
      return false;
    }
  }

  // Send notification when a passenger requests a ride
  async notifyDriverOfRequest(driverPhone: string, passengerName: string, rideDetails: {
    origin: string;
    destination: string;
    departureTime: string;
    seats: number;
  }): Promise<boolean> {
    const message = `🚗 New ride request from ${passengerName}!\n\nRoute: ${rideDetails.origin} → ${rideDetails.destination}\nDeparture: ${rideDetails.departureTime}\nSeats: ${rideDetails.seats}\n\nLogin to Trek.com/rides to approve or decline.`;
    
    return this.sendSMS({
      to: driverPhone,
      message
    });
  }

  // Send notification when a driver approves a passenger
  async notifyPassengerOfApproval(passengerPhone: string, driverName: string, rideDetails: {
    origin: string;
    destination: string;
    departureTime: string;
    driverPhone: string;
  }): Promise<boolean> {
    const message = `✅ Your ride request approved by ${driverName}!\n\nRoute: ${rideDetails.origin} → ${rideDetails.destination}\nDeparture: ${rideDetails.departureTime}\nDriver: ${driverName} (${rideDetails.driverPhone})\n\nLogin to Trek.com/rides to manage your ride.`;
    
    return this.sendSMS({
      to: passengerPhone,
      message
    });
  }

  // Send notification when a passenger cancels a ride
  async notifyDriverOfCancellation(driverPhone: string, passengerName: string, rideDetails: {
    origin: string;
    destination: string;
    departureTime: string;
    reason?: string;
  }): Promise<boolean> {
    const reasonText = rideDetails.reason ? `\n\nReason: ${rideDetails.reason}` : '';
    const message = `❌ ${passengerName} cancelled their ride request.\n\nRoute: ${rideDetails.origin} → ${rideDetails.destination}\nDeparture: ${rideDetails.departureTime}${reasonText}\n\nLogin to Trek.com/rides to manage your rides.`;
    
    return this.sendSMS({
      to: driverPhone,
      message
    });
  }

  // Send notification when a driver cancels a ride
  async notifyPassengerOfCancellation(passengerPhone: string, driverName: string, rideDetails: {
    origin: string;
    destination: string;
    departureTime: string;
    reason?: string;
  }): Promise<boolean> {
    const reasonText = rideDetails.reason ? `\n\nReason: ${rideDetails.reason}` : '';
    const message = `❌ ${driverName} cancelled the ride.\n\nRoute: ${rideDetails.origin} → ${rideDetails.destination}\nDeparture: ${rideDetails.departureTime}${reasonText}\n\nLogin to Trek.com/rides to find another ride.`;
    
    return this.sendSMS({
      to: passengerPhone,
      message
    });
  }

  // Send notification when a driver rejects a passenger's ride request
  async notifyPassengerOfRejection(passengerPhone: string, driverName: string, rideDetails: {
    origin: string;
    destination: string;
    departureTime: string;
    reason?: string;
  }): Promise<boolean> {
    const reasonText = rideDetails.reason ? `\n\nReason: ${rideDetails.reason}` : '';
    const message = `❌ Your ride request was rejected by ${driverName}.\n\nRoute: ${rideDetails.origin} → ${rideDetails.destination}\nDeparture: ${rideDetails.departureTime}${reasonText}\n\nLogin to Trek.com/rides to find another ride.`;
    
    return this.sendSMS({
      to: passengerPhone,
      message
    });
  }
}

export const twilioService = new TwilioService();