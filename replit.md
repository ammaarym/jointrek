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

## User Preferences

Preferred communication style: Simple, everyday language.