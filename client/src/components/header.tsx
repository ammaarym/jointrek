import { useState } from "react";
import { Link, useLocation } from "wouter";
import { Button } from "./ui/button";
import { useAuth } from "@/hooks/use-auth-new";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { MenuIcon, HelpCircle } from "lucide-react";
import trekLogo from "@assets/treklogo1_1749600620192.png";

interface HeaderProps {
  onLogin: () => void;
  onSignup: () => void;
}

export default function Header({ onLogin, onSignup }: HeaderProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [location, navigate] = useLocation();
  const { currentUser, signOut } = useAuth();

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const getInitials = (name: string) => {
    if (!name) return "U";
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase();
  };

  const handleLogout = async () => {
    await signOut();
    navigate("/");
  };

  return (
    <header className="sticky top-0 z-50 bg-white shadow-md border-b border-neutral-200">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center space-x-2">
            <Link href={currentUser ? "/find-rides" : "/"} className="flex items-center">
              <img src={trekLogo} alt="Trek" className="h-12 w-auto" />
            </Link>
          </div>

          <div className="hidden md:flex items-center space-x-6">
            {currentUser && (
              <>
                <Link href="/find-rides">
                  <span
                    className={`text-neutral-700 hover:text-primary cursor-pointer ${location === "/find-rides" ? "text-primary" : ""}`}
                  >
                    Find Rides
                  </span>
                </Link>
                <Link href="/post-ride">
                  <span
                    className={`text-neutral-700 hover:text-primary cursor-pointer ${location === "/post-ride" ? "text-primary" : ""}`}
                  >
                    Post a Ride
                  </span>
                </Link>
                <Link href="/request-ride">
                  <span
                    className={`text-neutral-700 hover:text-primary cursor-pointer ${location === "/request-ride" ? "text-primary" : ""}`}
                  >
                    Request a Ride
                  </span>
                </Link>
                <Link href="/my-rides">
                  <span
                    className={`text-neutral-700 hover:text-primary cursor-pointer ${location === "/my-rides" ? "text-primary" : ""}`}
                  >
                    My Posts
                  </span>
                </Link>
                <Link href="/help">
                  <span
                    className={`text-neutral-700 hover:text-primary cursor-pointer ${location === "/help" ? "text-primary" : ""}`}
                  >
                    Help
                  </span>
                </Link>

              </>
            )}
          </div>

          <div className="flex items-center space-x-4">
            {/* Admin Login Button */}
            <Link href="/admin-login">
              <Button
                variant="outline"
                size="sm"
                className="hidden md:flex bg-red-500 text-white border-red-500 hover:bg-red-600 hover:border-red-600"
              >
                Admin
              </Button>
            </Link>

            {/* Help Button */}


            {currentUser ? (
              <>
                <div className="hidden md:block">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        className="relative rounded-full h-8 w-8 p-0 border border-neutral-300"
                      >
                        <Avatar className="h-8 w-8">
                          <AvatarImage
                            src={currentUser.photoURL || ""}
                            alt={currentUser.displayName || "User"}
                          />
                          <AvatarFallback>
                            {currentUser.displayName
                              ? getInitials(currentUser.displayName)
                              : "U"}
                          </AvatarFallback>
                        </Avatar>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-56">
                      <div className="flex items-center justify-start gap-2 p-2">
                        <div className="flex flex-col space-y-1">
                          <p className="text-sm font-medium">
                            {currentUser.displayName}
                          </p>
                          <p className="text-xs text-neutral-500">
                            {currentUser.email}
                          </p>
                        </div>
                      </div>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem asChild>
                        <Link href="/profile" className="cursor-pointer w-full">
                          Profile
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        onClick={async () => {
                          await signOut();
                          // Clear all browser storage to remove cached credentials
                          localStorage.clear();
                          sessionStorage.clear();
                          // Force a page reload to clear Firebase cache
                          window.location.href = '/';
                        }}
                        className="cursor-pointer"
                      >
                        Switch Account
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={handleLogout}
                        className="cursor-pointer"
                      >
                        Log out
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </>
            ) : null}

            {/* Mobile menu button */}
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden"
              onClick={toggleMobileMenu}
            >
              <MenuIcon className="h-6 w-6 text-black" />
            </Button>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden py-4 border-t border-neutral-200">
            <div className="flex flex-col space-y-3">
              {!currentUser && (
                <Link href="/" onClick={() => setIsMobileMenuOpen(false)}>
                  <span
                    className={`block py-2 px-3 rounded-md ${location === "/" ? "bg-primary text-primary" : "text-neutral-700"}`}
                  >
                    Home
                  </span>
                </Link>
              )}

              {/* Mobile Admin Button */}
              <Link href="/admin-login" onClick={() => setIsMobileMenuOpen(false)}>
                <Button
                  variant="outline"
                  className="bg-red-500 text-white border-red-500 hover:bg-red-600 hover:border-red-600 w-full justify-start items-center gap-2 py-2 px-3"
                >
                  Admin Login
                </Button>
              </Link>

              {/* Mobile Help Button */}
              <Dialog>
                <DialogTrigger asChild>
                  <Button
                    variant="outline"
                    className="bg-blue-500 text-white border-blue-500 hover:bg-blue-600 hover:border-blue-600 w-full justify-start items-center gap-2 py-2 px-3"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    <HelpCircle className="h-4 w-4" />
                    Help & Guide
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-md">
                  <DialogHeader>
                    <DialogTitle className="flex items-center gap-2 mb-4">
                      <HelpCircle className="h-5 w-5 text-blue-500" />
                      How to Use Trek
                    </DialogTitle>
                    <DialogDescription className="text-left space-y-4">
                      <div>
                        <h4 className="font-semibold text-sm text-gray-900 mb-2">📱 Contact Method Required</h4>
                        <p className="text-sm text-gray-600">You must add a contact method (phone number or social media) in your profile to access the Find Rides section and view other users' rides.</p>
                      </div>
                      
                      <div>
                        <h4 className="font-semibold text-sm text-gray-900 mb-2">🚗 Post a Ride (As Driver)</h4>
                        <p className="text-sm text-gray-600">Share your trip from/to Gainesville. Set your price, departure time, and available seats. Other students can find and contact you.</p>
                      </div>
                      
                      <div>
                        <h4 className="font-semibold text-sm text-gray-900 mb-2">🎒 Request a Ride (As Passenger)</h4>
                        <p className="text-sm text-gray-600">Looking for a ride? Post your travel needs and drivers can reach out to offer you a spot in their car.</p>
                      </div>
                      
                      <div>
                        <h4 className="font-semibold text-sm text-gray-900 mb-2">🔍 Find Rides</h4>
                        <p className="text-sm text-gray-600">Browse available rides and ride requests. Filter by date, destination, and preferences to find the perfect match.</p>
                      </div>
                      
                      <div>
                        <h4 className="font-semibold text-sm text-gray-900 mb-2">📱 Contact & Complete</h4>
                        <p className="text-sm text-gray-600">Use the contact info to coordinate with other students. Mark rides as complete when finished to keep your profile clean.</p>
                      </div>
                      
                      <div className="bg-blue-50 p-3 rounded-lg">
                        <p className="text-xs text-blue-800"><strong>UF Students Only:</strong> You must use your @ufl.edu email to access Trek. All rides must start from or end in Gainesville.</p>
                      </div>
                    </DialogDescription>
                  </DialogHeader>
                </DialogContent>
              </Dialog>

              {currentUser ? (
                <>
                  <Link
                    href="/find-rides"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    <span
                      className={`block py-2 px-3 rounded-md ${location === "/find-rides" ? "bg-primary/10 text-primary" : "text-neutral-700"}`}
                    >
                      Find Rides
                    </span>
                  </Link>
                  <Link
                    href="/post-ride"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    <span
                      className={`block py-2 px-3 rounded-md ${location === "/post-ride" ? "bg-primary/10 text-primary" : "text-neutral-700"}`}
                    >
                      Post a Ride
                    </span>
                  </Link>
                  <Link
                    href="/request-ride"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    <span
                      className={`block py-2 px-3 rounded-md ${location === "/request-ride" ? "bg-primary/10 text-primary" : "text-neutral-700"}`}
                    >
                      Request a Ride
                    </span>
                  </Link>
                  <Link
                    href="/my-rides"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    <span
                      className={`block py-2 px-3 rounded-md ${location === "/my-rides" ? "bg-primary/10 text-primary" : "text-neutral-700"}`}
                    >
                      My Posts
                    </span>
                  </Link>
                  <Link
                    href="/help"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    <span
                      className={`block py-2 px-3 rounded-md ${location === "/help" ? "bg-primary/10 text-primary" : "text-neutral-700"}`}
                    >
                      Help
                    </span>
                  </Link>
                  <Link
                    href="/profile"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    <span
                      className={`block py-2 px-3 rounded-md ${location === "/profile" ? "bg-primary/10 text-primary" : "text-neutral-700"}`}
                    >
                      Profile
                    </span>
                  </Link>
                  <div>
                    <Button
                      variant="ghost"
                      className="w-full justify-start py-2 px-3 rounded-md text-red-600 hover:bg-red-50"
                      onClick={() => {
                        handleLogout();
                        setIsMobileMenuOpen(false);
                      }}
                    >
                      Log Out
                    </Button>
                  </div>
                </>
              ) : (
                <div className="space-y-2 pt-2">
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => {
                      onLogin();
                      setIsMobileMenuOpen(false);
                    }}
                  >
                    Log In
                  </Button>
                  <Button
                    className="w-full bg-primary text-white hover:bg-primary"
                    onClick={() => {
                      onSignup();
                      setIsMobileMenuOpen(false);
                    }}
                  >
                    Sign Up
                  </Button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
