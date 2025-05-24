import { Router, Request, Response } from "express";

const router = Router();

// Gas price cache - stores price and timestamp
let gasPriceCache: { price: number; timestamp: number } | null = null;
const CACHE_DURATION = 60 * 60 * 1000; // 1 hour in milliseconds

// Distance map from Gainesville to other Florida cities (in miles)
const CITY_DISTANCES: { [key: string]: number } = {
  "Miami": 335,
  "Orlando": 115,
  "Tampa": 125,
  "Jacksonville": 72,
  "Tallahassee": 150,
  "Fort Lauderdale": 320,
  "St. Petersburg": 135,
  "Pensacola": 350,
  "West Palm Beach": 280,
  "Boca Raton": 300,
  "Sarasota": 145,
  "Clearwater": 135,
  "Daytona Beach": 90,
  "Fort Myers": 200,
  "Naples": 230,
  "Key West": 450,
  "Ocala": 35,
  "Lakeland": 105
};

// Function to fetch current gas price from GasBuddy
async function fetchGasPrice(): Promise<number> {
  // Check cache first
  if (gasPriceCache && (Date.now() - gasPriceCache.timestamp) < CACHE_DURATION) {
    console.log('Using cached gas price:', gasPriceCache.price);
    return gasPriceCache.price;
  }

  try {
    console.log('Fetching fresh gas price from GasBuddy...');
    
    const response = await fetch('https://www.gasbuddy.com/graphql', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      },
      body: JSON.stringify({
        query: `
          query GetGasPrice($search: String!) {
            locationBySearchTerm(search: $search) {
              trends {
                today
              }
            }
          }
        `,
        variables: {
          search: "32608" // Gainesville zip code
        }
      })
    });

    if (!response.ok) {
      throw new Error(`GasBuddy API error: ${response.status}`);
    }

    const data = await response.json();
    const gasPrice = data?.data?.locationBySearchTerm?.trends?.today;
    
    if (!gasPrice || typeof gasPrice !== 'number') {
      throw new Error('Invalid gas price data received');
    }

    // Cache the result
    gasPriceCache = {
      price: gasPrice,
      timestamp: Date.now()
    };

    console.log('Fetched fresh gas price:', gasPrice);
    return gasPrice;
  } catch (error) {
    console.error('Error fetching gas price:', error);
    // Fallback to a reasonable default if API fails
    const fallbackPrice = 3.20; // Gainesville gas price
    console.log('Using fallback gas price:', fallbackPrice);
    return fallbackPrice;
  }
}

// Function to calculate ride estimate (simplified gas cost only)
export async function getRideEstimate(destination: string, mpg: number): Promise<number> {
  try {
    const distance = CITY_DISTANCES[destination];
    if (!distance) {
      throw new Error(`Distance not found for destination: ${destination}`);
    }

    const gasPrice = await fetchGasPrice();
    
    // Calculate just the gas cost: (distance / mpg) × gasPrice
    // This should be lower than the actual ride price
    const gasCost = (distance / mpg) * gasPrice;
    
    // Round to nearest dollar
    return Math.round(gasCost);
  } catch (error) {
    console.error('Error calculating ride estimate:', error);
    throw error;
  }
}

// API endpoint to get ride estimate
router.post("/estimate", async (req: Request, res: Response) => {
  try {
    const { destination, mpg } = req.body;
    
    if (!destination || !mpg) {
      return res.status(400).json({ 
        error: "Missing required fields: destination and mpg" 
      });
    }

    if (typeof mpg !== 'number' || mpg <= 0) {
      return res.status(400).json({ 
        error: "MPG must be a positive number" 
      });
    }

    const estimate = await getRideEstimate(destination, mpg);
    
    res.json({
      destination,
      distance: CITY_DISTANCES[destination] || null,
      mpg,
      estimatedCost: estimate,
      currency: 'USD'
    });
  } catch (error: any) {
    console.error("Error calculating ride estimate:", error);
    res.status(500).json({ 
      error: error.message || "Failed to calculate ride estimate" 
    });
  }
});

// API endpoint to get current gas price
router.get("/current-price", async (req: Request, res: Response) => {
  try {
    const gasPrice = await fetchGasPrice();
    res.json({
      price: gasPrice,
      location: "Gainesville, FL (32608)",
      currency: 'USD',
      lastUpdated: gasPriceCache?.timestamp || Date.now()
    });
  } catch (error: any) {
    console.error("Error fetching gas price:", error);
    res.status(500).json({ 
      error: error.message || "Failed to fetch gas price" 
    });
  }
});

export default router;