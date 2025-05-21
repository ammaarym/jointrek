/**
 * This utility syncs Firebase user data with our PostgreSQL database
 */

import { User as FirebaseUser } from 'firebase/auth';

/**
 * Function to sync a Firebase user to our PostgreSQL backend
 */
export async function syncUserToPostgres(user: FirebaseUser): Promise<boolean> {
  try {
    // Check if the user exists first
    const checkResponse = await fetch(`/api/users/firebase/${user.uid}`);
    
    if (checkResponse.status === 404) {
      // User doesn't exist in PostgreSQL - create them
      const createResponse = await fetch('/api/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          firebaseUid: user.uid,
          email: user.email || '',
          displayName: user.displayName || 'GatorLift User',
          photoUrl: user.photoURL || null,
          emailVerified: user.emailVerified || false
        })
      });
      
      if (!createResponse.ok) {
        console.error('Failed to create user in PostgreSQL:', await createResponse.text());
        return false;
      }
      
      console.log('User successfully created in PostgreSQL');
      return true;
    } 
    
    if (checkResponse.ok) {
      // User exists - no need to create
      console.log('User already exists in PostgreSQL');
      return true;
    }
    
    console.error('Error checking user in PostgreSQL:', checkResponse.status);
    return false;
  } catch (error) {
    console.error('Error syncing user to PostgreSQL:', error);
    return false;
  }
}