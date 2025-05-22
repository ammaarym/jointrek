import { Ride } from '@shared/schema';

/**
 * This adapter converts a PostgreSQL ride format to the format expected by the RideCard component
 * which was originally designed for Firebase data
 */
export function adaptPostgresRideToCardFormat(postgresRide: any) {
  return {
    ...postgresRide,
    id: postgresRide.id.toString(), // Convert ID to string for compatibility
    driver: {
      id: postgresRide.driverId,
      name: postgresRide.driverName || 'Unknown Driver',
      photoUrl: postgresRide.driverPhoto || `https://ui-avatars.com/api/?name=${encodeURIComponent(postgresRide.driverName || 'User')}&background=orange&color=fff`,
      rating: 5,
      totalRides: 0,
      contactInfo: {
        email: postgresRide.driverEmail || (postgresRide.driverId + '@ufl.edu'),
        phone: postgresRide.phone,
        instagram: postgresRide.instagram,
        snapchat: postgresRide.snapchat
      }
    },
    origin: {
      city: postgresRide.origin,
      area: postgresRide.originArea
    },
    destination: {
      city: postgresRide.destination,
      area: postgresRide.destinationArea
    }
  };
}