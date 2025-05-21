/**
 * Utility functions for handling date conversions between Firebase timestamps and 
 * the PostgreSQL database dates
 */

/**
 * Converts a Firebase timestamp object to a JavaScript Date
 * @param timestamp The Firebase timestamp object
 * @returns A JavaScript Date object
 */
export function timestampToDate(timestamp: { seconds: number; nanoseconds: number }): Date {
  return new Date(timestamp.seconds * 1000);
}

/**
 * Formats a date for display in the UI
 * @param date A Date object or Firebase timestamp
 * @returns A formatted date string (e.g., "May 21, 2025 at 3:30 PM")
 */
export function formatDate(date: Date | { seconds: number; nanoseconds: number }): string {
  const dateObj = date instanceof Date ? date : timestampToDate(date);
  
  return dateObj.toLocaleString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  });
}

/**
 * Formats a time for display in the UI
 * @param date A Date object or Firebase timestamp
 * @returns A formatted time string (e.g., "3:30 PM")
 */
export function formatTime(date: Date | { seconds: number; nanoseconds: number }): string {
  const dateObj = date instanceof Date ? date : timestampToDate(date);
  
  return dateObj.toLocaleString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  });
}

/**
 * Formats a date in ISO format for input fields
 * @param date A Date object or Firebase timestamp
 * @returns A formatted date string in YYYY-MM-DD format
 */
export function formatDateForInput(date: Date | { seconds: number; nanoseconds: number }): string {
  const dateObj = date instanceof Date ? date : timestampToDate(date);
  
  return dateObj.toISOString().split('T')[0];
}

/**
 * Formats a time in HH:MM format for input fields
 * @param date A Date object or Firebase timestamp
 * @returns A formatted time string in HH:MM format
 */
export function formatTimeForInput(date: Date | { seconds: number; nanoseconds: number }): string {
  const dateObj = date instanceof Date ? date : timestampToDate(date);
  
  const hours = dateObj.getHours().toString().padStart(2, '0');
  const minutes = dateObj.getMinutes().toString().padStart(2, '0');
  
  return `${hours}:${minutes}`;
}

/**
 * Combines a date string (YYYY-MM-DD) and time string (HH:MM) into a JavaScript Date
 * @param dateStr A date string in YYYY-MM-DD format
 * @param timeStr A time string in HH:MM format
 * @returns A JavaScript Date object
 */
export function combineDateAndTime(dateStr: string, timeStr: string): Date {
  const [year, month, day] = dateStr.split('-').map(Number);
  const [hours, minutes] = timeStr.split(':').map(Number);
  
  return new Date(year, month - 1, day, hours, minutes);
}

/**
 * Calculates the arrival time based on departure time and travel duration
 * @param departureTime The departure time
 * @param durationMinutes The travel duration in minutes
 * @returns The calculated arrival time
 */
export function calculateArrivalTime(departureTime: Date, durationMinutes: number): Date {
  const arrivalTime = new Date(departureTime);
  arrivalTime.setMinutes(arrivalTime.getMinutes() + durationMinutes);
  return arrivalTime;
}

/**
 * Converts a Firebase ride data format to the format expected by the PostgreSQL API
 * @param firebaseRide The ride data from Firebase
 * @returns Ride data formatted for the PostgreSQL API
 */
export function convertFirebaseRideToPostgres(firebaseRide: any) {
  return {
    driverId: firebaseRide.driver.id,
    origin: firebaseRide.origin.city,
    originArea: firebaseRide.origin.area,
    destination: firebaseRide.destination.city,
    destinationArea: firebaseRide.destination.area,
    departureTime: timestampToDate(firebaseRide.departureTime),
    arrivalTime: timestampToDate(firebaseRide.arrivalTime),
    seatsTotal: firebaseRide.seatsTotal,
    seatsLeft: firebaseRide.seatsLeft,
    price: firebaseRide.price,
    genderPreference: firebaseRide.genderPreference,
    carModel: firebaseRide.carModel || null,
    notes: firebaseRide.notes || null,
    rideType: firebaseRide.rideType || 'driver'
  };
}