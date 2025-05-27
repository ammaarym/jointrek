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
import { MenuIcon } from "lucide-react";
// Updated GatorLift logo as inline SVG

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
            <div className="flex items-center">
              <svg className="h-10 w-auto mr-2" viewBox="0 0 100 60" xmlns="http://www.w3.org/2000/svg">
                {/* Alligator shape */}
                <path d="M10 35 C 15 30, 25 28, 35 30 L 60 32 C 70 33, 80 35, 90 40 L 85 45 C 80 42, 70 40, 60 39 L 35 37 C 25 36, 15 38, 10 42 Z" fill="#D2691E"/>
                {/* Alligator spikes */}
                <polygon points="20,30 25,25 30,30" fill="#D2691E"/>
                <polygon points="35,29 40,24 45,29" fill="#D2691E"/>
                <polygon points="50,30 55,25 60,30" fill="#D2691E"/>
                {/* Alligator legs */}
                <rect x="25" y="42" width="8" height="12" rx="4" fill="#D2691E"/>
                <rect x="45" y="42" width="8" height="12" rx="4" fill="#D2691E"/>
                <rect x="65" y="42" width="8" height="12" rx="4" fill="#D2691E"/>
              </svg>
              <span className="text-2xl font-bold" style={{color: '#2F4858'}}>GatorLift</span>
            </div>
          </div>

          <div className="hidden md:flex items-center space-x-6">
            {!currentUser && (
              <Link href="/">
                <span className={`text-neutral-700 hover:text-orange-600 cursor-pointer ${location === "/" ? "text-orange-600" : ""}`}>
                  Home
                </span>
              </Link>
            )}
            {currentUser && (
              <>
                <Link href="/find-rides">
                  <span className={`text-neutral-700 hover:text-orange-600 cursor-pointer ${location === "/find-rides" ? "text-orange-600" : ""}`}>
                    Find Rides
                  </span>
                </Link>
                <Link href="/post-ride">
                  <span className={`text-neutral-700 hover:text-orange-600 cursor-pointer ${location === "/post-ride" ? "text-orange-600" : ""}`}>
                    Post a Ride
                  </span>
                </Link>
                <Link href="/my-rides">
                  <span className={`text-neutral-700 hover:text-orange-600 cursor-pointer ${location === "/my-rides" ? "text-orange-600" : ""}`}>
                    My Rides
                  </span>
                </Link>
              </>
            )}
          </div>

          <div className="flex items-center space-x-4">
            {currentUser ? (
              <>
                <div className="hidden md:block">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" className="relative rounded-full h-8 w-8 p-0 border border-neutral-300">
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={currentUser.photoURL || ""} alt={currentUser.displayName || "User"} />
                          <AvatarFallback>{currentUser.displayName ? getInitials(currentUser.displayName) : "U"}</AvatarFallback>
                        </Avatar>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-56">
                      <div className="flex items-center justify-start gap-2 p-2">
                        <div className="flex flex-col space-y-1">
                          <p className="text-sm font-medium">{currentUser.displayName}</p>
                          <p className="text-xs text-neutral-500">{currentUser.email}</p>
                        </div>
                      </div>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem asChild>
                        <Link href="/profile" className="cursor-pointer w-full">
                          Profile
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={handleLogout} className="cursor-pointer">
                        Log out
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </>
            ) : (
              <div className="hidden md:flex items-center space-x-3">
                <Button
                  onClick={onLogin}
                  className="bg-orange-600 text-white hover:bg-orange-700"
                >
                  Log In
                </Button>
              </div>
            )}

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
                  <span className={`block py-2 px-3 rounded-md ${location === "/" ? "bg-orange-50 text-orange-600" : "text-neutral-700"}`}>
                    Home
                  </span>
                </Link>
              )}
              
              {currentUser ? (
                <>
                  <Link href="/find-rides" onClick={() => setIsMobileMenuOpen(false)}>
                    <span className={`block py-2 px-3 rounded-md ${location === "/find-rides" ? "bg-orange-50 text-orange-600" : "text-neutral-700"}`}>
                      Find Rides
                    </span>
                  </Link>
                  <Link href="/post-ride" onClick={() => setIsMobileMenuOpen(false)}>
                    <span className={`block py-2 px-3 rounded-md ${location === "/post-ride" ? "bg-orange-50 text-orange-600" : "text-neutral-700"}`}>
                      Post a Ride
                    </span>
                  </Link>
                  <Link href="/my-rides" onClick={() => setIsMobileMenuOpen(false)}>
                    <span className={`block py-2 px-3 rounded-md ${location === "/my-rides" ? "bg-orange-50 text-orange-600" : "text-neutral-700"}`}>
                      My Rides
                    </span>
                  </Link>
                  <Link href="/profile" onClick={() => setIsMobileMenuOpen(false)}>
                    <span className={`block py-2 px-3 rounded-md ${location === "/profile" ? "bg-orange-50 text-orange-600" : "text-neutral-700"}`}>
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
                    className="w-full bg-orange-600 text-white hover:bg-orange-700"
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