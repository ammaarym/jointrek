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
                <Link href="/messages">
                  <span className={`text-neutral-700 hover:text-orange-600 cursor-pointer ${location === "/messages" ? "text-orange-600" : ""}`}>
                    Messages
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
                <Button variant="ghost" onClick={onLogin} className="text-black">
                  Log In
                </Button>
                <Button
                  onClick={onSignup}
                  className="bg-orange-600 text-white hover:bg-orange-700"
                >
                  Sign Up
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
              <Link href="/" onClick={() => setIsMobileMenuOpen(false)}>
                <span className={`block py-2 px-3 rounded-md ${location === "/" ? "bg-orange-50 text-orange-600" : "text-neutral-700"}`}>
                  Home
                </span>
              </Link>
              
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
                  <Link href="/messages" onClick={() => setIsMobileMenuOpen(false)}>
                    <span className={`block py-2 px-3 rounded-md ${location === "/messages" ? "bg-orange-50 text-orange-600" : "text-neutral-700"}`}>
                      Messages
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