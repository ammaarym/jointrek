import { useState } from "react";
import { Link, useLocation } from "wouter";
import { Button } from "./ui/button";
import { useAuth } from "@/hooks/use-auth";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { CarTaxiFront, BellIcon, MenuIcon, User } from "lucide-react";

interface HeaderProps {
  onLogin: () => void;
  onSignup: () => void;
}

export default function Header({ onLogin, onSignup }: HeaderProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [location] = useLocation();
  const { currentUser, signOut } = useAuth();

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase();
  };

  return (
    <header className="sticky top-0 z-50 bg-white shadow-md border-b border-neutral-200">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center space-x-2">
            <CarTaxiFront className="text-orange-600 h-6 w-6" />
            <span className="text-xl font-semibold text-black">
              GatorLift
            </span>
          </div>

          <div className="hidden md:flex items-center space-x-6">
            <Link href="/">
              <span className={`text-neutral-700 hover:text-orange-600 cursor-pointer ${location === "/" ? "text-orange-600" : ""}`}>
                Home
              </span>
            </Link>
            <Link href="/find-rides">
              <span className={`text-neutral-700 hover:text-orange-600 cursor-pointer ${location === "/find-rides" ? "text-orange-600" : ""}`}>
                Find Rides
              </span>
            </Link>
            <Link href="/post-ride">
              <span className={`text-neutral-700 hover:text-orange-600 cursor-pointer ${location === "/post-ride" ? "text-orange-600" : ""}`}>
                Post Ride
              </span>
            </Link>
            {currentUser && (
              <Link href="/messages">
                <span className={`text-neutral-700 hover:text-orange-600 cursor-pointer ${location === "/messages" ? "text-orange-600" : ""}`}>
                  Messages
                </span>
              </Link>
            )}
          </div>

          <div className="flex items-center space-x-4">
            {!currentUser ? (
              <div className="hidden md:block">
                <Button
                  variant="outline"
                  className="text-black font-medium hover:text-orange-600 border-black"
                  onClick={() => window.location.href = "/find-rides"}
                >
                  Find Rides
                </Button>
                <Button
                  className="ml-4 bg-orange-600 text-white px-4 py-2 rounded-md font-medium hover:bg-opacity-90 transition"
                  onClick={() => window.location.href = "/post-ride"}
                >
                  Post Ride
                </Button>
              </div>
            ) : (
              <div className="flex items-center space-x-3">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      className="p-2 rounded-full hover:bg-neutral-100 dark:hover:bg-neutral-800 relative"
                    >
                      <BellIcon className="h-5 w-5" />
                      <span className="absolute top-1 right-1 w-4 h-4 bg-primary-orange text-white text-xs rounded-full flex items-center justify-center">
                        3
                      </span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-80">
                    <div className="px-4 py-3 font-medium">Notifications</div>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem className="p-3 cursor-pointer">
                      <div className="flex flex-col">
                        <span className="font-medium">New ride request</span>
                        <span className="text-sm text-neutral-500">
                          David N. has requested to join your ride to Orlando
                        </span>
                      </div>
                    </DropdownMenuItem>
                    <DropdownMenuItem className="p-3 cursor-pointer">
                      <div className="flex flex-col">
                        <span className="font-medium">Ride confirmed</span>
                        <span className="text-sm text-neutral-500">
                          Your ride with Alyssa M. to Tampa is confirmed
                        </span>
                      </div>
                    </DropdownMenuItem>
                    <DropdownMenuItem className="p-3 cursor-pointer">
                      <div className="flex flex-col">
                        <span className="font-medium">New message</span>
                        <span className="text-sm text-neutral-500">
                          Tyler J. sent you a message about your ride
                        </span>
                      </div>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem className="p-2 text-center text-primary-blue cursor-pointer">
                      View all notifications
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="p-0 rounded-full">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={currentUser.photoURL || ""} alt={currentUser.displayName || ""} />
                        <AvatarFallback className="bg-primary-blue text-white">
                          {currentUser.displayName
                            ? getInitials(currentUser.displayName)
                            : "U"}
                        </AvatarFallback>
                      </Avatar>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => window.location.href = "/profile"} className="cursor-pointer">
                      <User className="mr-2 h-4 w-4" />
                      <span>Profile</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => window.location.href = "/my-rides"} className="cursor-pointer">
                      <CarTaxiFront className="mr-2 h-4 w-4" />
                      <span>My Rides</span>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={signOut} className="cursor-pointer">
                      Log out
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            )}

            <Button
              variant="ghost"
              size="icon"
              className="md:hidden"
              onClick={toggleMobileMenu}
            >
              <MenuIcon className="h-6 w-6" />
            </Button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <div className="md:hidden border-t border-neutral-200">
          <div className="space-y-1 px-4 py-3">
            <Link href="/">
              <span
                className={`block py-2 text-neutral-700 cursor-pointer ${
                  location === "/" ? "text-orange-600" : ""
                }`}
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Home
              </span>
            </Link>
            <Link href="/find-rides">
              <span
                className={`block py-2 text-neutral-700 cursor-pointer ${
                  location === "/find-rides" ? "text-orange-600" : ""
                }`}
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Find Rides
              </span>
            </Link>
            <Link href="/post-ride">
              <span
                className={`block py-2 text-neutral-700 cursor-pointer ${
                  location === "/post-ride" ? "text-orange-600" : ""
                }`}
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Post Ride
              </span>
            </Link>
            {currentUser && (
              <Link href="/messages">
                <span
                  className={`block py-2 text-neutral-700 cursor-pointer ${
                    location === "/messages" ? "text-orange-600" : ""
                  }`}
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  Messages
                </span>
              </Link>
            )}
            {!currentUser && (
              <div className="pt-2 border-t border-neutral-200 mt-2">
                <Button
                  variant="ghost"
                  className="w-full justify-start px-0 text-neutral-700"
                  onClick={() => {
                    setIsMobileMenuOpen(false);
                    onLogin();
                  }}
                >
                  Log In
                </Button>
                <Button
                  className="w-full mt-2 bg-orange-600 text-white"
                  onClick={() => {
                    setIsMobileMenuOpen(false);
                    onSignup();
                  }}
                >
                  Sign Up
                </Button>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
