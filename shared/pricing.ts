export interface RidePricingParams {
  distance: number;         // in miles
  mpg: number;              // vehicle fuel efficiency
  gasPrice: number;         // price per gallon
  destination: string;
  seatsTotal: number;       // number of total seats to split cost
  date?: Date;              // optional, for weekend adjustment
}

export function calculateRidePrice({
  distance,
  mpg,
  gasPrice,
  destination,
  seatsTotal,
  date
}: RidePricingParams): number {
  const buffer = 0.2; // 20% markup
  const tollCities = ["Miami", "Tampa"];
  const tollFee = tollCities.includes(destination) ? 2.5 : 0;

  // Raw cost calculation
  let baseCost = (distance / mpg) * gasPrice;
  let total = baseCost * (1 + buffer) + tollFee;

  // Weekend check (Friday = 5, Saturday = 6)
  if (date) {
    const day = date.getDay();
    if (day === 5 || day === 6) {
      total *= 1.1; // 10% increase on weekends
    }
  }

  // Divide total cost by number of seats (each passenger pays their share)
  let pricePerSeat = total / seatsTotal;

  // Apply floor and ceiling to per-seat price
  pricePerSeat = Math.max(8, Math.min(pricePerSeat, 60));

  // Round to nearest dollar
  return Math.round(pricePerSeat);
}

// Car type MPG mappings
export const CAR_TYPE_MPG = {
  "sedan": 32,
  "suv": 25,
  "truck": 22,
  "minivan": 28,
  "": 32 // Default to sedan MPG
};

// Distance data from Gainesville to major Florida cities
export const CITY_DISTANCES = {
  "Orlando": { miles: 113, hours: 2 },
  "Tampa": { miles: 125, hours: 2.5 },
  "Miami": { miles: 350, hours: 5.5 },
  "Jacksonville": { miles: 73, hours: 1.5 },
  "Tallahassee": { miles: 140, hours: 2.5 },
  "Fort Lauderdale": { miles: 340, hours: 5 },
  "St. Petersburg": { miles: 135, hours: 2.5 },
  "Pensacola": { miles: 340, hours: 5 },
  "Daytona Beach": { miles: 125, hours: 2 },
  "Fort Myers": { miles: 200, hours: 3.5 }
};