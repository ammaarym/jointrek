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
      if (!this.client) {
        console.warn('Twilio client not initialized. Skipping SMS.');
        return false;
      }

      // Clean phone number - remove any non-digits and ensure it starts with +1
      let phoneNumber = data.to.replace(/\D/g, '');
      if (phoneNumber.length === 10) {
        phoneNumber = '1' + phoneNumber;
      }
      if (!phoneNumber.startsWith('1')) {
        phoneNumber = '1' + phoneNumber;
      }
      phoneNumber = '+' + phoneNumber;

      const message = await this.client.messages.create({
        body: data.message,
        messagingServiceSid: this.messagingServiceSid,
        to: phoneNumber
      });

      console.log(`SMS sent successfully: ${message.sid} to ${phoneNumber}`);
      return true;
    } catch (error) {
      console.error('Failed to send SMS:', error);
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
    const message = `🚗 New ride request from ${passengerName}!\n\nRoute: ${rideDetails.origin} → ${rideDetails.destination}\nDeparture: ${rideDetails.departureTime}\nSeats: ${rideDetails.seats}\n\nLog in to Trek to approve or decline.`;
    
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
    const message = `✅ Your ride request approved by ${driverName}!\n\nRoute: ${rideDetails.origin} → ${rideDetails.destination}\nDeparture: ${rideDetails.departureTime}\nDriver: ${driverName} (${rideDetails.driverPhone})\n\nSee you then!`;
    
    return this.sendSMS({
      to: passengerPhone,
      message
    });
  }
}

export const twilioService = new TwilioService();