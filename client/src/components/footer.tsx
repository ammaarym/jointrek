import React from "react";
import { Link, useLocation } from "wouter";
import { CarTaxiFront, Mail, MapPin } from "lucide-react";
import { FaInstagram, FaTwitter, FaFacebookSquare } from "react-icons/fa";
import { useAuth } from "../hooks/use-auth-new";

export default function Footer() {
  const { currentUser } = useAuth();
  const [location] = useLocation();

  // Don't show footer if user is logged in or on home page (coming soon)
  if (currentUser || location === '/') {
    return null;
  }
  return (
    <footer className="bg-white dark:bg-dark-background border-t border-neutral-200 dark:border-neutral-800 py-8">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div>
            <div className="flex items-center space-x-2 mb-4">
              <span className="text-xl font-bold text-stone-900 dark:text-white font-satoshi">
                Trek
              </span>
            </div>
            <p className="text-neutral-600 dark:text-neutral-400 mb-4">
              The safe, convenient ride-sharing platform exclusively for
              University of Florida students.
            </p>
            <div className="flex space-x-4">
              <a
                href="#"
                className="text-neutral-600 dark:text-neutral-400 hover:text-primary"
              >
                <FaInstagram className="h-5 w-5" />
              </a>
              <a
                href="#"
                className="text-neutral-600 dark:text-neutral-400 hover:text-primary"
              >
                <FaTwitter className="h-5 w-5" />
              </a>
              <a
                href="#"
                className="text-neutral-600 dark:text-neutral-400 hover:text-primary"
              >
                <FaFacebookSquare className="h-5 w-5" />
              </a>
            </div>
          </div>

          <div>
            <h4 className="font-semibold mb-4 dark:text-white">Quick Links</h4>
            <ul className="space-y-2">
              <li>
                <Link href="/" className="text-neutral-600 dark:text-neutral-400 hover:text-primary">
                  Home
                </Link>
              </li>
              <li>
                <Link href="/find-rides" className="text-neutral-600 dark:text-neutral-400 hover:text-primary">
                  Find Rides
                </Link>
              </li>
              <li>
                <Link href="/post-ride" className="text-neutral-600 dark:text-neutral-400 hover:text-primary">
                  Post a Ride
                </Link>
              </li>
              <li>
                <Link href="/profile" className="text-neutral-600 dark:text-neutral-400 hover:text-primary">
                  My Account
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold mb-4 dark:text-white">Support</h4>
            <ul className="space-y-2">
              <li>
                <a
                  href="#"
                  className="text-neutral-600 dark:text-neutral-400 hover:text-primary"
                >
                  Help Center
                </a>
              </li>
              <li>
                <a
                  href="#"
                  className="text-neutral-600 dark:text-neutral-400 hover:text-primary"
                >
                  Safety Guidelines
                </a>
              </li>
              <li>
                <Link href="/terms-of-service" className="text-neutral-600 dark:text-neutral-400 hover:text-primary">
                  Terms of Service
                </Link>
              </li>
              <li>
                <a
                  href="#"
                  className="text-neutral-600 dark:text-neutral-400 hover:text-primary"
                >
                  Privacy Policy
                </a>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold mb-4 dark:text-white">Contact</h4>
            <ul className="space-y-2">
              <li className="flex items-center">
                <Mail className="mr-2 h-4 w-4 text-primary" />
                <span className="text-neutral-600 dark:text-neutral-400">
                  support@trek.com
                </span>
              </li>
              <li className="flex items-center">
                <MapPin className="mr-2 h-4 w-4 text-primary" />
                <span className="text-neutral-600 dark:text-neutral-400">
                  University of Florida, Gainesville, FL
                </span>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-neutral-200 dark:border-neutral-800 mt-8 pt-8 text-center text-neutral-600 dark:text-neutral-400 text-sm">
          <p>
            © {new Date().getFullYear()} Trek. All rights reserved. Not
            affiliated with the University of Florida.
          </p>
        </div>
      </div>
    </footer>
  );
}
