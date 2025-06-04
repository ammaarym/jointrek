import twilio from 'twilio';

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const twilioPhoneNumber = process.env.TWILIO_PHONE_NUMBER;

if (!accountSid || !authToken || !twilioPhoneNumber) {
  console.error('Missing Twilio credentials in environment variables');
}

const client = twilio(accountSid, authToken);

interface RideRequestNotification {
  driverPhone: string;
  passengerName: string;
  origin: string;
  destination: string;
  departureTime: string;
  price: string;
  requestId: string;
}

export async function sendRideRequestNotification({
  driverPhone,
  passengerName,
  origin,
  destination,
  departureTime,
  price,
  requestId
}: RideRequestNotification): Promise<boolean> {
  try {
    if (!twilioPhoneNumber) {
      throw new Error('Twilio phone number not configured');
    }

    // Format the departure time nicely
    const date = new Date(departureTime);
    const formattedTime = date.toLocaleString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });

    // Create the approval URL using the actual deployment domain
    const baseUrl = process.env.REPLIT_DEV_DOMAIN 
      ? `https://${process.env.REPLIT_DEV_DOMAIN}` 
      : 'https://1cb44fa1-20ec-4cdb-a065-663477f691ab-00-kp492x7mwy8q.worf.replit.dev';
    
    const approvalUrl = `${baseUrl}/requests/${requestId}`;

    const message = `${passengerName} has requested to trek with you from ${origin} to ${destination} on ${formattedTime} for $${price}. View & approve here: ${approvalUrl}`;

    const result = await client.messages.create({
      body: message,
      from: twilioPhoneNumber,
      to: driverPhone
    });

    console.log(`SMS sent successfully to ${driverPhone}, SID: ${result.sid}`);
    return true;
  } catch (error) {
    console.error('Error sending SMS notification:', error);
    return false;
  }
}

export async function sendRideApprovalNotification({
  passengerPhone,
  driverName,
  origin,
  destination,
  departureTime,
  driverContact
}: {
  passengerPhone: string;
  driverName: string;
  origin: string;
  destination: string;
  departureTime: string;
  driverContact: string;
}): Promise<boolean> {
  try {
    if (!twilioPhoneNumber) {
      throw new Error('Twilio phone number not configured');
    }

    const date = new Date(departureTime);
    const formattedTime = date.toLocaleString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });

    const message = `Good news! ${driverName} has approved your trek request from ${origin} to ${destination} on ${formattedTime}. Contact them at: ${driverContact}`;

    const result = await client.messages.create({
      body: message,
      from: twilioPhoneNumber,
      to: passengerPhone
    });

    console.log(`Approval SMS sent successfully to ${passengerPhone}, SID: ${result.sid}`);
    return true;
  } catch (error) {
    console.error('Error sending approval SMS notification:', error);
    return false;
  }
}