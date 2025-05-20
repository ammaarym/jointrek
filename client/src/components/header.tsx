import { useState } from "react";
import { Link, useLocation } from "wouter";
import { ThemeToggle } from "./ui/theme-toggle";
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
    <header className="sticky top-0 z-50 bg-white dark:bg-dark-background shadow-md border-b border-neutral-200 dark:border-neutral-800">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center space-x-2">
            <CarTaxiFront className="text-primary-orange h-6 w-6" />
            <span className="text-xl font-semibold text-primary-blue dark:text-white">
              GatorLift
            </span>
          </div>

          <div className="hidden md:flex items-center space-x-6">
            <Link href="/">
              <a className={`text-neutral-700 dark:text-neutral-200 hover:text-primary-orange dark:hover:text-primary-orange ${location === "/" ? "text-primary-orange" : ""}`}>
                Home
              </a>
            </Link>
            <Link href="/find-rides">
              <a className={`text-neutral-700 dark:text-neutral-200 hover:text-primary-orange dark:hover:text-primary-orange ${location === "/find-rides" ? "text-primary-orange" : ""}`}>
                Find Rides
              </a>
            </Link>
            <Link href="/post-ride">
              <a className={`text-neutral-700 dark:text-neutral-200 hover:text-primary-orange dark:hover:text-primary-orange ${location === "/post-ride" ? "text-primary-orange" : ""}`}>
                Post Ride
              </a>
            </Link>
            {currentUser && (
              <Link href="/messages">
                <a className={`text-neutral-700 dark:text-neutral-200 hover:text-primary-orange dark:hover:text-primary-orange ${location === "/messages" ? "text-primary-orange" : ""}`}>
                  Messages
                </a>
              </Link>
            )}
          </div>

          <div className="flex items-center space-x-4">
            <ThemeToggle />

            {!currentUser ? (
              <div className="hidden md:block">
                <Button
                  variant="ghost"
                  className="text-primary-blue dark:text-white font-medium hover:text-primary-orange"
                  onClick={onLogin}
                >
                  Log In
                </Button>
                <Button
                  className="ml-4 bg-primary-orange text-white px-4 py-2 rounded-md font-medium hover:bg-opacity-90 transition"
                  onClick={onSignup}
                >
                  Sign Up
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
                    <DropdownMenuItem asChild>
                      <Link href="/profile">
                        <a className="flex items-center cursor-pointer">
                          <User className="mr-2 h-4 w-4" />
                          <span>Profile</span>
                        </a>
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href="/my-rides">
                        <a className="flex items-center cursor-pointer">
                          <CarTaxiFront className="mr-2 h-4 w-4" />
                          <span>My Rides</span>
                        </a>
                      </Link>
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
        <div className="md:hidden border-t border-neutral-200 dark:border-neutral-800">
          <div className="space-y-1 px-4 py-3">
            <Link href="/">
              <a
                className={`block py-2 text-neutral-700 dark:text-neutral-200 ${
                  location === "/" ? "text-primary-orange" : ""
                }`}
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Home
              </a>
            </Link>
            <Link href="/find-rides">
              <a
                className={`block py-2 text-neutral-700 dark:text-neutral-200 ${
                  location === "/find-rides" ? "text-primary-orange" : ""
                }`}
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Find Rides
              </a>
            </Link>
            <Link href="/post-ride">
              <a
                className={`block py-2 text-neutral-700 dark:text-neutral-200 ${
                  location === "/post-ride" ? "text-primary-orange" : ""
                }`}
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Post Ride
              </a>
            </Link>
            {currentUser && (
              <Link href="/messages">
                <a
                  className={`block py-2 text-neutral-700 dark:text-neutral-200 ${
                    location === "/messages" ? "text-primary-orange" : ""
                  }`}
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  Messages
                </a>
              </Link>
            )}
            {!currentUser && (
              <div className="pt-2 border-t border-neutral-200 dark:border-neutral-700 mt-2">
                <Button
                  variant="ghost"
                  className="w-full justify-start px-0 text-neutral-700 dark:text-neutral-200"
                  onClick={() => {
                    setIsMobileMenuOpen(false);
                    onLogin();
                  }}
                >
                  Log In
                </Button>
                <Button
                  className="w-full mt-2 bg-primary-orange text-white"
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
