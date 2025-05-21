import { Ride } from '@shared/schema';

/**
 * This adapter converts a PostgreSQL ride format to the format expected by the RideCard component
 * which was originally designed for Firebase data
 */
export function adaptPostgresRideToCardFormat(postgresRide: Ride) {
  return {
    ...postgresRide,
    id: postgresRide.id.toString(), // Convert ID to string for compatibility
    driver: {
      id: postgresRide.driverId,
      name: 'UF Driver', // This would ideally come from a user lookup
      photoUrl: 'https://ui-avatars.com/api/?name=UF+Driver&background=orange&color=fff',
      rating: 5,
      totalRides: 0,
      contactInfo: {
        email: postgresRide.driverId + '@ufl.edu',
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