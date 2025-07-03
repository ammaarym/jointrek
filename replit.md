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
- June 29, 2025: Fixed "Coming Soon" implementation - corrected home-enhanced-fixed.tsx file to properly replace both sticky header and main card "Get Started" buttons with "Coming Soon" badges and messaging
- June 29, 2025: Simplified coming soon landing page - removed "Please sign in to continue" section entirely and replaced with clean, prominent "Coming Soon" card focusing solely on launch messaging
- June 29, 2025: Enhanced StarBorder "Coming Soon" button - increased size, added light beige background (#F5F0E8), improved spacing, and made more prominent for better visual appeal on landing page
- June 29, 2025: Updated safety features section - replaced "Secure Payments" with "Contact Privacy" feature explaining that phone numbers and social media are only shared after both parties approve rides
- June 29, 2025: Refined safety features section - replaced "Ride Tracking" with "Secure Payments" emphasizing Stripe encryption protection, shortened contact privacy description, and moved coming soon button higher on page
- June 29, 2025: Removed "Coming Soon" badge from sticky header - cleaned up landing page header to show only Trek logo for minimalist appearance
- June 29, 2025: Fixed sticky header scrolling issue - changed from semi-transparent backdrop-blur to solid white background to eliminate visible white gap when scrolling up
- June 29, 2025: Reduced home page element sizes - made text, spacing, and sections smaller throughout for better scrolling experience while keeping ride screenshot image at original size for visibility
- June 29, 2025: Fixed header duplication issue - resolved duplicate Trek logo appearing when scrolling by hiding global header component on home page, eliminating visual conflicts between custom and global headers
- June 29, 2025: Added Umami analytics tracking - implemented website analytics script (ID: a1255eee-71c4-4d09-8386-fae40e456b55) in HTML head for comprehensive user behavior tracking across all pages
- June 29, 2025: Improved header spacing - added subtle padding between navigation bar and main content for better visual separation on landing page
- June 29, 2025: Compressed three main sections - significantly reduced padding, text sizes, and spacing in "How Trek Works", "Your Safety is Our Priority", and "FAQ" sections for more compact landing page layout
- June 29, 2025: Enhanced hero section spacing - increased top padding from pt-20 to pt-24 to create better visual separation between navigation bar and main headline
- June 29, 2025: Fixed ride request functionality - resolved missing paymentMethodId parameter in frontend, added payment method validation, enhanced error handling, and confirmed API endpoint working with successful test (ride request #52 processed with Stripe payment authorization and SMS notifications)
- June 30, 2025: Enhanced authentication system reliability - implemented popup-to-redirect fallback mechanism for production environments, improved error handling with user-friendly messages, and added production-specific Firebase configuration to resolve authentication popup failures in deployed Replit environments
- June 30, 2025: Implemented device-specific authentication strategy - desktop browsers use popup authentication with redirect fallback, mobile devices automatically use redirect authentication, enhanced mobile redirect result processing with proper error handling and UF email domain validation
- June 30, 2025: Created comprehensive mobile authentication component - implemented redirect-based authentication with browserSessionPersistence, getRedirectResult() handling, and device-aware login system that automatically selects optimal authentication method based on device type
- June 30, 2025: Fixed mobile landing page spacing issues - reduced excessive whitespace by adjusting header padding (pt-16 vs pt-24), Coming Soon margins (mb-2 vs mb-8), section padding (py-2 vs py-4), and content spacing throughout for compact mobile layout
- June 30, 2025: Created comprehensive admin dashboard system - built enhanced admin dashboard with tabbed interface for users/rides/requests/database management, admin quick view page for essential information at a glance, CSV export functionality, detailed user/ride modals, real-time data refresh, and integrated admin dropdown menus in header for easy access to both quick view and full dashboard
- June 30, 2025: Fixed critical authentication system for ride posting and requesting - resolved Firebase Bearer token authentication in both server API routes and main routes, implemented automatic user creation for new drivers and passengers, fixed schema validation for price field conversion (number to string), and enabled complete ride request flow with proper user verification and database relationships
- July 1, 2025: Fixed payment method selection UX issue - replaced basic request ride page with enhanced version that shows payment method dropdown when cards exist (even if not set as default), corrected authentication hooks, and ensured proper API endpoint integration for seamless ride request flow
- July 1, 2025: Fixed "You can only complete your own rides" error for passengers - corrected frontend to use proper `/verify-complete` API endpoint instead of driver-only `/complete` endpoint, allowing both drivers and passengers to complete rides with verification codes
- July 1, 2025: Optimized real-time polling to prevent green card flashing - reduced polling frequency from 5 seconds to 15 seconds with intelligent conditions, only polls when active rides need updates, and reduced completion verification polling from 3 seconds to 10 seconds
- July 1, 2025: Enhanced car information display - updated ride cards to show full car make and model (e.g., "Chrysler Pacifica") instead of just model ("Pacifica") in both my-rides page and ride card component
- July 1, 2025: Optimized "Request a Trek" button performance - implemented TanStack Query caching with 5-15 minute cache times, added progressive loading with skeleton states, prefetched payment methods on Find Rides page, and enhanced payment method loading states to reduce perceived loading time from slow to instant for cached data
- July 1, 2025: Fixed payment method validation bug - resolved authentication timing issues where users with valid payment methods still saw "Payment Method Required" error by ensuring queries only run when user is fully authenticated and using proper authenticated API requests
- July 1, 2025: Fixed authentication unauthorized domain error - added auth/unauthorized-domain to fallback conditions so popup authentication automatically falls back to redirect when domain isn't authorized in Firebase, resolving login issues in Replit deployment environment
- July 1, 2025: Enhanced complaint system availability - Report Issue button now appears for both passengers and drivers at all stages once rides are approved (not started, started, and completed), enabling comprehensive issue reporting throughout the entire ride lifecycle
- July 1, 2025: Updated SMS message formatting and links - all SMS notifications now display names in "First Last" format instead of "Last, First", and redirect users to jointrek.com/my-rides instead of jointrek.replit.app for consistent branding
- July 1, 2025: Completed admin dashboard complaints management system - added comprehensive complaints tab between requests and database sections with color-coded status/priority badges, status and priority update forms, detailed complaint information display including reporter details and ride information, and integrated complaints data fetching with existing admin API
- July 1, 2025: Database cleanup and branding improvements - removed all test/fake users (Ashley Brown, David Miller, Jessica Taylor, Ryan Anderson, Sarah Johnson, Emily Davis, James Wilson, Mike Thompson) and their associated ride data, cleaned up mock ride entries, updated website title to "Trek" and added orange "T" favicon for consistent branding across browser tabs
- July 1, 2025: Completed comprehensive admin complaints management system - created dedicated complaints page at /admin-complaints with status/priority management capabilities, integrated orange "Complaints" button in admin dashboard header for direct access, and removed complaints links from dropdown menus to streamline navigation while maintaining functionality
- July 1, 2025: Enhanced complaint cards with passenger information display - added comprehensive passenger details (name, email, phone, social media) for driver complaints showing all approved passengers who were on the ride, enabling better context for resolving customer issues
- July 1, 2025: Fixed Safari font compatibility and mobile authentication debugging - replaced Satoshi font with Inter to resolve Safari loading errors, improved baggage badge spacing for better mobile display, and added comprehensive mobile authentication debug logging with MOBILE_DEBUG tags to help identify Safari login loop issues
- July 1, 2025: Implemented comprehensive Safari authentication fix - created dedicated Safari auth workaround module with session state management, OAuth parameter detection, enhanced persistence settings, and Safari-specific redirect handling to resolve Firebase authentication failures in Safari browsers
- July 1, 2025: Enhanced redirect result debugging for Safari authentication - added top-level getRedirectResult() check in login page with detailed logging, enhanced redirect result analysis with provider info and operation type, and implemented proper Firebase auth instance usage to track authentication flow completion
- July 1, 2025: Fixed critical Safari authentication timing issue - implemented proper sequencing to ensure getRedirectResult() completes before any page redirects occur, preventing Safari authentication loops by adding redirectResultChecked state flag that blocks navigation until redirect result processing finishes
- July 2, 2025: Updated Trek logo throughout entire application - replaced text-based "Trek" branding with new image logo (TREK_1751438959440.jpg) featuring map pin icon across header component, home landing page, login screen, and footer section for consistent visual branding
- July 2, 2025: Enhanced Trek logo visibility on landing page - updated to transparent background version (TREK_1751439396881.png) and increased sizes significantly (header: h-16, hero section: h-32 sm:h-48) for better brand recognition and professional appearance
- July 2, 2025: Redesigned landing page branding - removed top navigation bar, repositioned Trek logo as primary brand element above main headline with large responsive sizes (h-24 to h-52), and reduced spacing for compact professional layout
- July 2, 2025: Implemented new Trek presentation logo with optimized spacing - updated to wider horizontal logo format (TREK (Presentation)_1751439938143.png), eliminated wasted top space with zero padding, and fine-tuned section spacing with proper gaps between Coming Soon/How Trek Works and tighter Safety section layout
- July 2, 2025: Enhanced landing page with comprehensive improvements - standardized all heading sizes (text-2xl sm:text-3xl) and description text for visual consistency, implemented clickable "Get Early Access" button with smooth scroll to LinkedIn contact section, updated messaging to "I'm handpicking early testers for Trek's beta. Let me know if you want in.", optimized mobile spacing by removing min-height constraints and tightening gaps, repositioned decorative elements to page edges, and added user engagement poll with beige/white color scheme asking "Would you use Trek for ridesharing at UF?" without showing results
- July 2, 2025: Enhanced mobile user experience for Find Rides and My Posts pages - reduced filter popup size to compact modal instead of full-screen, optimized tab layouts with smaller text and icons for mobile, added xs breakpoint (480px) to Tailwind config, improved responsive spacing and padding throughout, made quick filter buttons and sort dropdown mobile-friendly with flex layouts, and created better mobile navigation flow
- July 2, 2025: Optimized ride card layout for compact display - moved price and seat information to the right side next to route information, reduced vertical height from 28 units to 20 units, integrated gender preference badges and baggage information inline with destinations, eliminated redundant spacing and created more efficient use of card real estate across all ride card components
- July 2, 2025: Fixed name formatting system - created comprehensive name formatter utility to convert "Last, First" format to "First Last" format during user signup and throughout application, updated 13 existing user records in database via SQL migration, standardized SMS message formatting to use consistent "First Last" naming convention, and removed "Needed:" text prefix from baggage information badges for cleaner UI
- July 2, 2025: Optimized desktop ride card layout for better visual hierarchy - positioned interest tags with increased spacing below driver info, aligned beige destination dot with Miami text, removed seats availability display from passenger ride cards, and removed "Baggage space:" label text for cleaner baggage badge presentation
- July 2, 2025: Simplified ride type filter tabs - removed "Available" prefix from "Available Drivers" and "Available Passengers" buttons, now showing simply "Drivers" and "Passengers" for cleaner interface, and increased ride card bottom padding from pb-6 to pb-8 for better visual spacing
- July 2, 2025: Enhanced landing page branding and animations - highlighted "Gators" text in beige color (#B8956B) to match Trek brand colors, added spring-powered pop animation to "Coming Soon" button that scales from 0 to create dramatic entrance effect appearing out of thin air, repositioned button above screenshot, and added spacing under screenshot image for better visual hierarchy
- July 2, 2025: Implemented comprehensive waitlist system - created fully functional email signup component with validation, loading states, and success/error messaging, replaced "Text me on LinkedIn" section with waitlist form, updated all beta testing references to waitlist language ("Join our waitlist and be the first to know when Trek launches!"), and styled with fully rounded design using rounded-full classes for modern appearance
- July 3, 2025: Added comprehensive insurance verification file upload system - implemented drag-and-drop file upload interface with support for JPEG, PNG, and PDF files up to 10MB, multer middleware for secure file handling, validation and error handling, visual file preview with removal capabilities, backend storage in uploads/insurance directory, and mandatory document upload requirement before form submission
- July 3, 2025: Enhanced help page with condensed insurance requirements section - added Florida state insurance requirements ($10,000 PIP/PDL), coverage limitations for ride-sharing activities, Trek verification requirements, and recommendations for ride-share endorsements to educate drivers about proper insurance coverage

## User Preferences

Preferred communication style: Simple, everyday language.