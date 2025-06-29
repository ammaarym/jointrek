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
- June 20, 2025: Updated branding to use Satoshi font text logo - replaced image logo with clean "Trek" text using Satoshi font, imported font via Google Fonts, and updated header and footer components
- June 20, 2025: Implemented complete driver offer system - drivers can now offer rides to passengers through dedicated "Offer a Trek" page with 300-character message limit, SMS notifications with proper name formatting (First Middle Last), and direct link to https://jointrek.replit.app/
- June 20, 2025: Completed driver offer acceptance flow - passengers can now accept driver offers which automatically creates approved ride requests, moves rides to "Approved Rides" section, and provides clickable notifications that navigate to ride requests tab via URL parameters
- June 20, 2025: Enhanced driver offer system with duplicate prevention - drivers can only make one pending offer per passenger ride until response received, and approved rides now display counter offer price instead of original ride price
- June 20, 2025: Fixed duplicate driver offer prevention - implemented robust server-side validation that blocks multiple pending offers from same driver, and fixed counter offer price display to show actual negotiated amount ($35) instead of original ride price ($25)
- June 20, 2025: Added comprehensive notifications page accessible via "View All Notifications" button - displays all notifications with timestamps, read/unread status, proper navigation to relevant sections, and smart filtering by notification type with visual indicators
- June 20, 2025: Created comprehensive Stripe driver setup guide page with step-by-step instructions, requirements checklist, timeline, common issues, and help resources - accessible via "Setup Guide" button in driver onboarding section for first-time driver account setup
- June 20, 2025: Added comprehensive security assurances about Stripe data handling throughout payment sections - clearly communicates that Trek never sees banking/credit card details, data is encrypted, PCI DSS compliant, and only Stripe has access to sensitive financial information
- June 20, 2025: Enhanced driver setup section with security assurances matching payment methods style - added green notice explaining Trek never sees banking/SSN details, and fixed text overflow in quick filter buttons by reducing font size and adjusting padding
- June 20, 2025: Completely redesigned home page with beige/orange accent colors throughout - updated hero section with gradient backgrounds, beige Trek logo, orange buttons and icons, enhanced testimonials with better styling, and added comprehensive security FAQ section with collapsible dropdowns covering banking security, scammer prevention, personal safety features, and payment protection
- June 21, 2025: Fixed mobile authentication redirect loop - enhanced redirect result handling with proper user state persistence, PostgreSQL sync before redirect, and improved button state management for cancelled popup authentication
- June 21, 2025: Resolved critical application loading issues - simplified authentication system with proper state management, fixed App.tsx structure, and created 8 demo rides from Gainesville with generic names, varying destinations ($20-50 prices), and mixed gender preferences for marketing screenshots
- June 21, 2025: Fixed critical "Loading profile..." white screen authentication bug - resolved useAuth hook inconsistencies across all components (header, login, home, my-rides, driver-onboard, profile) by standardizing to use-auth-fixed.tsx, ensuring proper context availability and eliminating undefined authentication state
- June 21, 2025: Resolved "Authentication failed. Please try again." Google sign-in error - implemented complete signInWithGoogle function in auth hook with popup/redirect fallback support, proper UF email validation, and redirect result handling for mobile and desktop authentication flows
- June 21, 2025: Completed authentication flow debugging and resolution - traced white screen issue through comprehensive debug logging, confirmed proper data loading sequence, and verified profile page renders correctly with user contact information after successful UF email authentication
- June 21, 2025: Implemented contextual error toast notifications system - added comprehensive error handling with automatic context detection, domain-specific error messages, enhanced toast variants (success, warning, info), UF email domain restriction for Google auth, and error boundary for app-wide error catching
- June 21, 2025: Simplified header and profile UI - removed "Switch Account" option from user dropdown menu and removed "Modify Setup" button from driver setup section, keeping only essential logout and account management functionality
- June 21, 2025: Removed persistent toast demo panel - contextual error toasts now only appear when actual events occur, eliminating the always-visible development testing panel
- June 21, 2025: Fixed mobile authentication redirect loop - enhanced redirect result handling with proper user state persistence, PostgreSQL sync before redirect, and improved button state management for cancelled popup authentication
- June 21, 2025: Resolved critical application loading issues - simplified authentication system with proper state management, fixed App.tsx structure, and created 8 demo rides from Gainesville with generic names, varying destinations ($20-50 prices), and mixed gender preferences for marketing screenshots
- June 21, 2025: Fixed critical "Loading profile..." white screen authentication bug - resolved useAuth hook inconsistencies across all components (header, login, home, my-rides, driver-onboard, profile) by standardizing to use-auth-fixed.tsx, ensuring proper context availability and eliminating undefined authentication state
- June 21, 2025: Resolved "Authentication failed. Please try again." Google sign-in error - implemented complete signInWithGoogle function in auth hook with popup/redirect fallback support, proper UF email validation, and redirect result handling for mobile and desktop authentication flows
- June 21, 2025: Completed authentication flow debugging and resolution - traced white screen issue through comprehensive debug logging, confirmed proper data loading sequence, and verified profile page renders correctly with user contact information after successful UF email authentication
- June 21, 2025: Implemented contextual error toast notifications system - added comprehensive error handling with automatic context detection, domain-specific error messages, enhanced toast variants (success, warning, info), UF email domain restriction for Google auth, and error boundary for app-wide error catching
- June 21, 2025: Simplified header and profile UI - removed "Switch Account" option from user dropdown menu and removed "Modify Setup" button from driver setup section, keeping only essential logout and account management functionality
- June 21, 2025: Removed persistent toast demo panel - contextual error toasts now only appear when actual events occur, eliminating the always-visible development testing panel
- June 21, 2025: Fixed first-time user white screen issue - corrected authentication timing problems by fixing duplicate setLoading calls, adding proper currentUser null checks, and fixing profile page useEffect dependencies to properly react to authentication state changes
- June 21, 2025: Restored contact info requirements for safety - users must add contact information (phone/Instagram/Snapchat) before accessing find-rides and my-rides pages to ensure safe communication between drivers and passengers
- June 21, 2025: Made phone number mandatory while keeping Instagram/Snapchat optional - users must provide phone number to access ride features, with social media contacts as additional optional information
- June 21, 2025: Fixed first-time user 404 error crash - implemented automatic user creation in PostgreSQL database when new UF users sign in, preventing profile page crashes and ensuring seamless onboarding experience
- June 25, 2025: Added comprehensive Apple Pay and Google Pay support - updated all payment forms to use PaymentElement with wallet integration, enabling mobile users to pay seamlessly via Apple Pay on iOS devices and Google Pay on Android devices
- June 25, 2025: Added mock ride data to Find Rides section with 5 sample rides to major Florida cities (Orlando, Miami, Tampa, Jacksonville, Fort Lauderdale) featuring mixed gender preferences (Any, Male Only, Female Only) and realistic driver profiles with varied pricing ($25-50) for demonstration purposes
- June 25, 2025: Fixed authentication timing issues for verified users - resolved "Authentication Required" messages by improving ProtectedRoute component to properly sequence loading, authentication checks, and contact info validation
- June 25, 2025: Updated mock ride destination areas to specific locations: Orlando (UCF Student Union), Tampa (USF Library), Jacksonville (St. Johns Town Center), Fort Lauderdale (Holiday Park) with working profile pictures and gender preference badges
- June 25, 2025: Fixed first-time user authentication flow - implemented comprehensive contact info refresh system with cache-busting, storage event listeners, and automatic state updates to ensure users can immediately access protected pages after adding phone numbers
- June 25, 2025: Resolved authentication timing issues for all protected pages - fixed continuous loading loop in Find Rides page and removed duplicate authentication checks in Post a Ride/Request a Ride pages, ensuring stable ProtectedRoute component with hasLoadedContactInfo state management
- June 25, 2025: Completed production cleanup - removed debug console logs from authentication hooks, protected routes, and find rides page to improve production performance and security
- June 25, 2025: Implemented comprehensive payment/driver setup verification system - users must complete payment method setup before requesting rides and driver account setup before posting rides, with dedicated setup check pages that guide users through required verification steps
- June 25, 2025: Updated setup verification logic - payment methods are only required for requesting rides, not for posting rides. Drivers only need to complete Stripe Connect driver account setup to post rides
- June 25, 2025: Enhanced setup verification cards with clickable interface - cards now have hover effects and "Click to setup →" indicators when financial setup is incomplete, making it easier for users to navigate directly to payment method or driver account setup pages
- June 26, 2025: Fixed setup verification system - users with complete financial setup are automatically redirected to forms, setup verification only appears when users lack required payment methods or driver accounts
- June 26, 2025: Fixed profile page payment methods display bug - corrected React Query authentication headers to properly fetch and display existing payment methods from Stripe API
- June 26, 2025: Added payment method deletion with clean red × buttons and enhanced UX with automatic scrolling to payment section when users click setup verification cards
- June 26, 2025: Renamed "Driver Setup" to "Bank Account Setup" throughout application for clearer terminology and added delete functionality for bank account setup with consistent UI design
- June 26, 2025: Implemented comprehensive SMS phone verification system - users must verify phone numbers via 6-digit SMS codes before accessing ride features, includes welcome message upon successful verification, verification status badges, and protected route enforcement requiring both phone number and verification
- June 26, 2025: Enhanced phone verification to accept flexible input formats - system now accepts phone numbers in any format (813-555-1234, 8135551234, +1 813 555 1234) and automatically normalizes to (XXX) XXX-XXXX standard for SMS delivery and database storage
- June 26, 2025: Fixed authentication timing issue in ProtectedRoute component - resolved recurring bug where verified users received "You must be logged in" errors when accessing post/request ride pages
- June 26, 2025: Enhanced phone verification UI - disabled phone input and verify button once verified, added verify button next to unverified numbers in both edit and display modes for better user experience
- June 26, 2025: Fixed authentication race condition causing "You must be logged in" errors - resolved timing issues in ProtectedRoute component with enhanced state management and authentication flow stabilization, ensuring reliable access to ride request functionality
- June 26, 2025: Fixed ride form authentication bug by standardizing auth hook usage - PostRidePostgres now uses use-auth-fixed instead of use-auth-new, eliminating race condition where currentUser was null during form submission despite successful authentication
- June 26, 2025: Added mobile hamburger menu for navigation when tabs are cramped - three-bar menu icon appears on mobile devices in header with all navigation options (Find Rides, Post a Ride, Request a Ride, My Posts, Help) accessible via dropdown
- June 28, 2025: Fixed mobile authentication popup failure - resolved Firebase network request errors by implementing direct Firebase auth usage instead of React context during form submission, eliminating race conditions and enabling reliable mobile login
- June 28, 2025: Implemented mobile-first Find Rides layout - moved filters to popup modal on mobile while keeping sidebar on desktop, ensuring rides display first on mobile with filter button for better user experience
- June 28, 2025: Standardized mobile layout consistency throughout help page - unified all icon sizes to w-5 h-5, added responsive text sizing (text-sm sm:text-base), and improved spacing for consistent mobile experience
- June 28, 2025: Removed redundant authentication checks from ride request and post ride forms - eliminated "You must be logged in" errors on form submission since users have already completed verification to access these pages
- June 28, 2025: Fixed Stripe bank account setup redirect URLs - updated return_url and refresh_url to redirect to profile page instead of non-existent driver-onboard page, eliminating 404 errors after completing Stripe Connect onboarding
- June 28, 2025: Commented out star ratings throughout application - removed star rating displays from user profile modals and ride cards while preserving ride count numbers, keeping rating code commented for future restoration
- June 28, 2025: Removed redundant driver verification from post ride form - eliminated duplicate verification checks, warning cards, and button disable conditions since users can only reach the form after completing verification
- June 28, 2025: Added Stripe Connect prefill functionality - automatically populates business information (transportation/ridesharing, Trek company details, jointrek.com website) and user details (name, email, phone) during driver account setup to reduce onboarding friction
- June 28, 2025: Enhanced home page with smooth fade-in animations and clean design - implemented staggered entrance effects matching demo screenshot with improved hero section, security features showcase, comprehensive FAQ section with collapsible questions covering banking security/scammer prevention/safety features/payment policies, and call-to-action sections
- June 29, 2025: Added Find Rides interface screenshot to home page hero section and removed bottom call-to-action section - integrated actual platform interface image with elegant styling to showcase functionality immediately after headline
- June 29, 2025: Optimized home page for mobile devices - reduced text sizes throughout (2xl vs 4xl+ headlines, sm vs lg body text), compressed section spacing (py-8 vs py-20), resized screenshot for mobile viewports, and made buttons/icons more compact while maintaining desktop experience
- June 29, 2025: Fixed mobile FAQ section display issues - implemented ultra-compact text sizes (11px/10px vs lg/base), shortened question text to prevent truncation, reduced padding and spacing significantly, and ensured all FAQ questions display properly on mobile without cutoff
- June 29, 2025: Added visual step-by-step driver setup guide that appears when Stripe popup opens - includes 5 comprehensive steps with icons, descriptions, and tips for business information, identity verification, bank details, tax information, and review/submit with security notices and automatic closing when popup closes
- June 29, 2025: Added sticky "Get Started" button to landing page header - positioned in top right aligned with Trek logo, stays visible while scrolling, includes hover effects and links to sign-in page for improved user accessibility
- June 29, 2025: Optimized landing page spacing - reduced padding between sticky header and main headline to create tighter, more compact layout with minimal whitespace for better mobile experience
- June 29, 2025: Enhanced landing page with stunning visual effects - integrated aurora backgrounds with animated gradients, floating particles (later removed), morphing shapes, floating elements, enhanced hover animations, and smooth transitions while maintaining all existing content and functionality
- June 29, 2025: Fixed critical ride posting database storage issue - resolved foreign key constraint violations by implementing automatic user creation in PostgreSQL when Firebase users post rides, ensuring seamless ride creation for both new and existing users without manual database intervention
- June 29, 2025: Resolved "Ride not found" error in ride request functionality - fixed App.tsx routing configuration where /request-ride/:id was incorrectly mapped to RequestRideSimplePage instead of RequestRidePage, eliminating authentication conflicts and enabling proper ride lookup and request processing
- June 29, 2025: Fixed ride data fetching in request-ride page - changed from fetching all rides and filtering to direct individual ride API calls (/api/rides/${rideId}), resolving authentication timing issues and ensuring reliable ride lookup for "Request a Trek" functionality
- June 29, 2025: Converted home page to "coming soon" landing page - replaced all "Get Started" buttons with "Coming Soon" messaging and removed footer section with Quick Links/Support/Contact for pre-launch marketing

## User Preferences

Preferred communication style: Simple, everyday language.