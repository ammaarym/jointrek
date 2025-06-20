# Trek Ride-Sharing Platform

## Overview

Trek is a ride-sharing platform designed exclusively for University of Florida students. The application enables students to safely share rides to campus, back home, or anywhere in between. It features Firebase authentication with UF email verification, PostgreSQL data storage, Stripe payment processing, and SMS notifications via Twilio.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite for development and bundling
- **Styling**: Tailwind CSS with shadcn/ui component library
- **State Management**: TanStack Query for server state, React Context for auth
- **Routing**: Wouter for client-side routing
- **Forms**: React Hook Form with Zod validation

### Backend Architecture
- **Runtime**: Node.js with Express.js server
- **Database**: PostgreSQL with Drizzle ORM
- **Authentication**: Firebase Auth (client-side) with custom server middleware
- **File Structure**: Monorepo with shared schema between client and server

### Authentication Strategy
- Firebase Authentication for UF email validation (@ufl.edu required)
- Client-side auth state management with server-side user info headers
- Automatic user synchronization between Firebase and PostgreSQL

## Key Components

### Database Schema (PostgreSQL)
- **Users**: Firebase UID, email, display name, contact info, Stripe customer data
- **Rides**: Complete ride information including pricing, seats, preferences
- **Bookings**: Passenger ride reservations with payment tracking
- **Messages/Conversations**: In-app messaging system
- **Reviews**: Driver and passenger rating system
- **Ride Requests**: Simplified booking workflow

### Payment Processing (Stripe)
- **Customer Management**: Automatic Stripe customer creation
- **Payment Methods**: Secure card storage and processing
- **Connect Accounts**: Driver payout system for marketplace payments
- **Platform Fees**: Configurable fee structure for ride transactions

### Communication System
- **SMS Notifications**: Twilio integration for ride updates
- **In-App Messaging**: Real-time chat between drivers and passengers
- **Email Integration**: Firebase Auth email verification

## Data Flow

1. **User Registration**: Firebase Auth → User sync to PostgreSQL → Stripe customer creation
2. **Ride Creation**: Form validation → PostgreSQL storage → Driver onboarding check
3. **Ride Booking**: Payment processing → Booking creation → SMS notifications
4. **Ride Management**: Real-time updates → Status tracking → Completion workflow

## External Dependencies

### Required Services
- **Firebase**: Authentication, project ID: gatorlift-a1a82
- **PostgreSQL**: Primary database (Neon serverless)
- **Stripe**: Payment processing and marketplace
- **Twilio**: SMS notifications

### Environment Variables
```
VITE_FIREBASE_API_KEY, VITE_FIREBASE_PROJECT_ID, VITE_FIREBASE_APP_ID
TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_PHONE_NUMBER
STRIPE_SECRET_KEY, VITE_STRIPE_PUBLIC_KEY
DATABASE_URL
```

## Deployment Strategy

### Replit Configuration
- **Runtime**: Node.js 20 with PostgreSQL 16 module
- **Development**: `npm run dev` (port 5000)
- **Production Build**: Vite build + esbuild server bundling
- **Auto-scaling**: Configured for autoscale deployment target

### Build Process
1. Client build with Vite (outputs to dist/public)
2. Server bundle with esbuild (outputs to dist/index.js)
3. Static asset serving in production mode

### Database Migrations
- Drizzle Kit for schema management
- Push command: `npm run db:push`
- Schema location: `shared/schema.ts`

## Changelog
- June 17, 2025: Initial setup
- June 17, 2025: Fixed automatic payment processing - now cancels and refunds unaccepted ride requests after 24 hours
- June 17, 2025: Enhanced payment flow - payments only captured when rides are completed, not when started. Added automatic refunds for rides that don't start within 24 hours of departure time
- June 17, 2025: Added refund protection for incomplete rides - passengers get refunded if rides are started but not completed within 24 hours
- June 17, 2025: Implemented comprehensive driver cancellation system - individual passenger removal buttons and driver self-cancellation for entire rides
- June 17, 2025: Added automatic cleanup system - old ride requests auto-removed (12h for cancelled/rejected, 48h for approved)
- June 17, 2025: Fixed cleanup system - manually removed 8 old requests and ensured daily cleanup runs properly
- June 17, 2025: Implemented complete ride cancellation SMS notifications - drivers and passengers now receive SMS alerts when rides are cancelled by either party
- June 17, 2025: Fixed cancelled ride status display - cancelled rides now properly show as "CANCELLED" in requests and are removed from approved rides sections
- June 17, 2025: Implemented dynamic baggage availability tracking - baggage allocations automatically update when passengers are approved/rejected/cancelled
- June 17, 2025: Added SMS notifications for ride rejections - passengers receive text messages when drivers reject their requests with Trek login links
- June 17, 2025: Fixed cancelled ride status display - cancelled rides now show "CANCELLED" instead of "Request Sent" on find rides page
- June 17, 2025: Reset all user reviews and ride counts to zero for fresh start of rating system
- June 17, 2025: Added SMS notifications for driver-initiated passenger cancellations - passengers now receive text messages when drivers cancel them from rides
- June 17, 2025: Implemented comprehensive car selection system - added make/model/year dropdowns with 27 major brands, hundreds of models, and years from 1980-2026
- June 17, 2025: Enhanced baggage labeling - drivers now see "Available Baggage Space" vs passengers see "Baggage Requirements" with intelligent capacity suggestions based on vehicle type
- June 17, 2025: Added comprehensive baggage information display - baggage requirements/availability now visible on all ride cards, passenger cards, and ride management interfaces with color-coded badges
- June 17, 2025: Fixed critical baggage data bug - resolved database column mapping issue where snake_case columns weren't being converted to camelCase in API responses, ensuring baggage badges display properly
- June 17, 2025: Restricted admin access - admin button now only visible for specific authorized emails (adnansanaulla@ufl.edu and ammaar.mohammed@ufl.edu)
- June 17, 2025: Added driver setup modification options - drivers can now modify their account setup, access Stripe dashboard, or completely delete their driver account for flexibility
- June 18, 2025: Fixed popup blocking authentication issues - simplified to redirect-only authentication to eliminate browser popup blocking problems in production environment
- June 18, 2025: Resolved authentication redirect loops - fixed timing conflicts between Firebase auth state changes and React navigation by using Wouter routing and proper async state management
- June 18, 2025: Implemented comprehensive authentication redirects - authenticated users are now automatically redirected from login/home pages to profile page using window.location.replace() for reliable navigation
- June 18, 2025: Fixed session persistence issues - configured Firebase auth with browserLocalPersistence and improved state synchronization to maintain login status across page navigation
- June 18, 2025: Completely rebuilt Firebase authentication flow - fixed getRedirectResult() and onAuthStateChanged() coordination, proper cleanup functions, browserSessionPersistence configuration, and eliminated redirect loops for reliable Google sign-in
- June 18, 2025: Simplified authentication architecture - removed duplicate persistence configurations, streamlined auth hook initialization, and fixed path-based redirect logic to eliminate login issues
- June 18, 2025: Completed Replit production authentication flow - implemented comprehensive Firebase auth fixes with enhanced local storage persistence, robust redirect result handling, and complete sign-out process that clears all auth state for reliable Google authentication in Replit's deployment environment
- June 20, 2025: Fixed Firebase authentication redirect session state loss issue - implemented popup-based authentication with fallback to redirect, enhanced debugging system, and Replit-specific auth state persistence to resolve OAuth redirect failures in production environment
- June 20, 2025: Enhanced admin dashboard with comprehensive user management - added full contact information display (phone, Instagram, Snapchat), complete user editing capabilities, user deletion with cascade cleanup, and cleared rides database for fresh start

## User Preferences

Preferred communication style: Simple, everyday language.