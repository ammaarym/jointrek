import React, { useState, useEffect } from "react";
import { FaGasPump } from "react-icons/fa";

interface GasPriceEstimateProps {
  destination: string;
  carType?: string;
}

export default function GasPriceEstimate({
  destination,
  carType,
}: GasPriceEstimateProps) {
  const [estimate, setEstimate] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchEstimate = async () => {
      setLoading(true);
      try {
        // Use car-specific MPG or default to sedan
        const CAR_TYPE_MPG = {
          Sedan: 32,
          SUV: 25,
          Truck: 22,
          Minivan: 28,
        };
        const averageMpg =
          CAR_TYPE_MPG[carType as keyof typeof CAR_TYPE_MPG] || 32;

        const response = await fetch("/api/gas-price/estimate", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            destination: destination,
            mpg: averageMpg,
          }),
        });

        if (response.ok) {
          const data = await response.json();
          setEstimate(data.estimatedCost);
        }
      } catch (error) {
        console.error("Error fetching gas price estimate:", error);
        // Don't show anything if there's an error
      } finally {
        setLoading(false);
      }
    };

    if (destination) {
      fetchEstimate();
    }
  }, [destination]);

  if (loading) {
    return (
      <div className="text-xs text-gray-400 flex items-center">
        <FaGasPump className="mr-1" />
        Loading...
      </div>
    );
  }

  if (!estimate) {
    return null;
  }

  return (
    <div className="text-xs text-green-600 flex items-center mt-1">
      <FaGasPump className="mr-1" />
      Est. gas cost: ${estimate}
    </div>
  );
}
