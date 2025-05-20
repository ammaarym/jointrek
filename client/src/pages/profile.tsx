import React, { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/hooks/use-auth";
import { toast } from "@/hooks/use-toast";
import { db } from "@/lib/firebase";
import { collection, query, where, getDocs } from "firebase/firestore";
import { updateProfile } from "firebase/auth";
import { Ride } from "@/lib/types";
import RideCard from "@/components/ride-card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Pencil, User } from "lucide-react";

export default function Profile() {
  const [, setLocation] = useLocation();
  const { currentUser, signOut } = useAuth();
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [rides, setRides] = useState<Ride[]>([]);
  const [bookings, setBookings] = useState<Ride[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (currentUser) {
      const names = currentUser.displayName?.split(" ") || ["", ""];
      setFirstName(names[0]);
      setLastName(names.slice(1).join(" "));

      // Fetch user rides
      const fetchUserRides = async () => {
        setLoading(true);
        try {
          const ridesQuery = query(
            collection(db, "rides"),
            where("driver.id", "==", currentUser.uid)
          );
          const ridesSnapshot = await getDocs(ridesQuery);
          const ridesList: Ride[] = [];
          
          ridesSnapshot.forEach((doc) => {
            ridesList.push({ id: doc.id, ...doc.data() } as Ride);
          });
          
          setRides(ridesList);

          // Get bookings (rides where the user is a passenger)
          const bookingsQuery = query(
            collection(db, "rides"),
            where("passengers", "array-contains", currentUser.uid)
          );
          const bookingsSnapshot = await getDocs(bookingsQuery);
          const bookingsList: Ride[] = [];
          
          bookingsSnapshot.forEach((doc) => {
            bookingsList.push({ id: doc.id, ...doc.data() } as Ride);
          });
          
          setBookings(bookingsList);
        } catch (error) {
          console.error("Error fetching user rides:", error);
          toast({
            title: "Error",
            description: "Failed to load your rides",
            variant: "destructive",
          });
        } finally {
          setLoading(false);
        }
      };

      fetchUserRides();
    }
  }, [currentUser]);

  const handleUpdateProfile = async () => {
    if (!currentUser) return;

    try {
      await updateProfile(currentUser, {
        displayName: `${firstName} ${lastName}`,
      });
      
      setIsEditing(false);
      
      toast({
        title: "Profile updated",
        description: "Your profile information has been updated successfully.",
      });
    } catch (error) {
      console.error("Error updating profile:", error);
      toast({
        title: "Update failed",
        description: "There was a problem updating your profile.",
        variant: "destructive",
      });
    }
  };

  const handleLogout = async () => {
    try {
      await signOut();
      setLocation("/");
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase();
  };

  if (!currentUser) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <Card className="max-w-md mx-auto">
          <CardContent className="pt-6">
            <h2 className="text-2xl font-bold mb-4">Login Required</h2>
            <p className="mb-4">Please log in to view your profile.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-5xl mx-auto">
        <div className="flex flex-col md:flex-row gap-6">
          {/* Profile Info Card */}
          <div className="md:w-1/3">
            <Card>
              <CardContent className="p-6">
                <div className="flex flex-col items-center text-center">
                  <Avatar className="h-24 w-24 mb-4">
                    <AvatarImage src={currentUser.photoURL || ""} alt={currentUser.displayName || ""} />
                    <AvatarFallback className="bg-primary-blue text-white text-xl">
                      {currentUser.displayName ? getInitials(currentUser.displayName) : <User />}
                    </AvatarFallback>
                  </Avatar>
                  
                  {isEditing ? (
                    <div className="space-y-4 w-full">
                      <div>
                        <Label htmlFor="firstName">First Name</Label>
                        <Input
                          id="firstName"
                          value={firstName}
                          onChange={(e) => setFirstName(e.target.value)}
                        />
                      </div>
                      <div>
                        <Label htmlFor="lastName">Last Name</Label>
                        <Input
                          id="lastName"
                          value={lastName}
                          onChange={(e) => setLastName(e.target.value)}
                        />
                      </div>
                      <div className="flex gap-2">
                        <Button 
                          onClick={handleUpdateProfile}
                          className="flex-1 bg-primary-blue text-white"
                        >
                          Save
                        </Button>
                        <Button 
                          variant="outline" 
                          onClick={() => setIsEditing(false)}
                          className="flex-1"
                        >
                          Cancel
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <h2 className="text-xl font-bold dark:text-white">
                        {currentUser.displayName || "User"}
                      </h2>
                      <p className="text-neutral-600 dark:text-neutral-400 mb-4">
                        {currentUser.email}
                      </p>
                      <div className="flex gap-2 w-full">
                        <Button 
                          onClick={() => setIsEditing(true)}
                          variant="outline"
                          className="flex-1"
                        >
                          <Pencil className="h-4 w-4 mr-2" />
                          Edit Profile
                        </Button>
                        <Button 
                          onClick={handleLogout}
                          variant="destructive"
                          className="flex-1"
                        >
                          Log Out
                        </Button>
                      </div>
                    </>
                  )}
                </div>

                <div className="mt-6 pt-6 border-t border-neutral-200 dark:border-neutral-700">
                  <div className="space-y-4">
                    <div className="flex justify-between">
                      <span className="text-neutral-600 dark:text-neutral-400">Email Verified</span>
                      <span className={currentUser.emailVerified ? "text-green-500" : "text-red-500"}>
                        {currentUser.emailVerified ? "Yes" : "No"}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-neutral-600 dark:text-neutral-400">Member Since</span>
                      <span className="dark:text-white">
                        {currentUser.metadata.creationTime ? 
                          new Date(currentUser.metadata.creationTime).toLocaleDateString() : 
                          "Unknown"}
                      </span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Tabs for Rides & Bookings */}
          <div className="md:w-2/3">
            <Tabs defaultValue="rides">
              <TabsList className="w-full">
                <TabsTrigger value="rides" className="flex-1">My Rides</TabsTrigger>
                <TabsTrigger value="bookings" className="flex-1">My Bookings</TabsTrigger>
              </TabsList>
              
              {/* My Rides Tab */}
              <TabsContent value="rides" className="mt-4 space-y-4">
                {!currentUser.emailVerified && (
                  <Alert className="mb-4">
                    <AlertTitle>Email verification required</AlertTitle>
                    <AlertDescription>
                      Please verify your email to post rides. Check your inbox for a verification link.
                    </AlertDescription>
                  </Alert>
                )}

                {loading ? (
                  <div className="text-center py-8">Loading rides...</div>
                ) : rides.length > 0 ? (
                  rides.map(ride => (
                    <RideCard key={ride.id} ride={ride} onBook={() => {}} />
                  ))
                ) : (
                  <div className="text-center py-8 bg-neutral-50 dark:bg-neutral-800 rounded-lg">
                    <h3 className="text-lg font-medium mb-2 dark:text-white">No rides posted</h3>
                    <p className="text-neutral-600 dark:text-neutral-400 mb-4">
                      You haven't posted any rides yet.
                    </p>
                    <Button 
                      asChild
                      className="bg-primary-orange text-white"
                    >
                      <a href="/post-ride">Post a Ride</a>
                    </Button>
                  </div>
                )}
              </TabsContent>
              
              {/* My Bookings Tab */}
              <TabsContent value="bookings" className="mt-4 space-y-4">
                {loading ? (
                  <div className="text-center py-8">Loading bookings...</div>
                ) : bookings.length > 0 ? (
                  bookings.map(ride => (
                    <RideCard key={ride.id} ride={ride} onBook={() => {}} />
                  ))
                ) : (
                  <div className="text-center py-8 bg-neutral-50 dark:bg-neutral-800 rounded-lg">
                    <h3 className="text-lg font-medium mb-2 dark:text-white">No bookings found</h3>
                    <p className="text-neutral-600 dark:text-neutral-400 mb-4">
                      You haven't booked any rides yet.
                    </p>
                    <Button 
                      asChild
                      className="bg-primary-orange text-white"
                    >
                      <a href="/find-rides">Find Rides</a>
                    </Button>
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
    </div>
  );
}
