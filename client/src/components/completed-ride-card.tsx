import React, { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Star, Calendar, MapPin, Users, DollarSign } from "lucide-react";
import { formatDate } from "../lib/date-utils";
import ReviewModal from "./review-modal";

interface CompletedRideCardProps {
  ride: {
    id: number;
    origin: string;
    originArea: string;
    destination: string;
    destinationArea: string;
    departureTime: string;
    price: string;
    seatsTotal: number;
    carModel: string;
    rideType: "driver" | "passenger";
    driverId: string;
    driver?: {
      displayName: string;
      photoUrl?: string;
    };
  };
  currentUserId: string;
  hasReviewed?: boolean;
  onReviewSubmit: (
    rideId: number,
    review: { rating: number; description: string },
  ) => void;
}

export default function CompletedRideCard({
  ride,
  currentUserId,
  hasReviewed = false,
  onReviewSubmit,
}: CompletedRideCardProps) {
  const [showReviewModal, setShowReviewModal] = useState(false);

  const isDriver = ride.rideType === "driver";
  const revieweeId = isDriver ? "passenger-placeholder" : ride.driverId;
  const revieweeName = isDriver
    ? "Passenger"
    : ride.driver?.displayName || "Driver";
  const reviewType = isDriver ? "passenger" : "driver";

  const handleReviewSubmit = async (review: {
    rating: number;
    description: string;
  }) => {
    await onReviewSubmit(ride.id, review);
    setShowReviewModal(false);
  };

  return (
    <>
      <Card className="mb-4 border border-gray-200 hover:shadow-md transition-shadow">
        <CardContent className="p-6">
          <div className="flex justify-between items-start mb-4">
            <div className="flex-1">
              <div className="flex items-center text-lg font-semibold text-gray-900 mb-2">
                <MapPin className="w-5 h-5 mr-2 text-primary" />
                {ride.origin} → {ride.destination}
              </div>
              <div className="text-sm text-gray-600 mb-2">
                {ride.originArea} → {ride.destinationArea}
              </div>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-primary">
                ${ride.price}
              </div>
              <div className="text-sm text-gray-500">per person</div>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
            <div className="flex items-center text-gray-600">
              <Calendar className="w-4 h-4 mr-2" />
              <span className="text-sm">{formatDate(ride.departureTime)}</span>
            </div>
            <div className="flex items-center text-gray-600">
              <Users className="w-4 h-4 mr-2" />
              <span className="text-sm">{ride.seatsTotal} seats</span>
            </div>
            <div className="flex items-center text-gray-600">
              <DollarSign className="w-4 h-4 mr-2" />
              <span className="text-sm capitalize">{ride.carModel}</span>
            </div>
            <div className="flex items-center text-gray-600">
              <span className="text-sm font-medium text-green-600">
                ✓ Completed
              </span>
            </div>
          </div>

          <div className="flex justify-between items-center pt-4 border-t border-gray-200">
            <div className="text-sm text-gray-600">
              You were the <span className="font-medium">{ride.rideType}</span>
            </div>

            {!hasReviewed ? (
              <Button
                onClick={() => setShowReviewModal(true)}
                className="bg-primary hover:bg-orange-700 text-white"
                size="sm"
              >
                <Star className="w-4 h-4 mr-2" />
                Leave Review
              </Button>
            ) : (
              <div className="flex items-center text-sm text-gray-500">
                <Star className="w-4 h-4 mr-1 text-yellow-400 fill-current" />
                Review submitted
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <ReviewModal
        isOpen={showReviewModal}
        onClose={() => setShowReviewModal(false)}
        rideData={{
          id: ride.id,
          revieweeId,
          revieweeName,
          reviewType: reviewType as "driver" | "passenger",
          origin: ride.origin,
          destination: ride.destination,
        }}
        onSubmit={handleReviewSubmit}
      />
    </>
  );
}
