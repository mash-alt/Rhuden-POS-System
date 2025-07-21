/**
 * adminLogin.js
 * 
 * This script logs in as the admin user to get proper authentication for database operations.
 * Use this when you encounter insufficient permissions errors.
 * 
 * Usage:
 * 1. Run this script directly with Node.js:
 *    node adminLogin.js
 * 
 * The script will:
 * 1. Log in as admin@admin.com with the default password
 * 2. Display the authentication token that can be used for other operations
 * 3. Store the auth token in a temporary file for other scripts to use
 */

const { initializeApp } = require('firebase/app');
const { 
  getAuth, 
  signInWithEmailAndPassword,
  setPersistence,
  browserLocalPersistence
} = require('firebase/auth');

// Try to load .env file if it exists
try {
  // Try both paths - project root and one directory up
  require('dotenv').config({ path: '../../.env' }) || require('dotenv').config({ path: '../.env' });
  console.log('Loaded environment variables from .env file');
} catch (error) {
  console.log('No .env file found, will use firebaseConfig.js or environment variables');
}

// Get Firebase configuration
let firebaseConfig;

// First try to use environment variables (support both formats: FIREBASE_ and VITE_FIREBASE_)
if ((process.env.FIREBASE_API_KEY || process.env.VITE_FIREBASE_API_KEY) && 
    (process.env.FIREBASE_PROJECT_ID || process.env.VITE_FIREBASE_PROJECT_ID)) {
  console.log('Using Firebase configuration from environment variables');
  firebaseConfig = {
    apiKey: process.env.FIREBASE_API_KEY || process.env.VITE_FIREBASE_API_KEY,
    authDomain: process.env.FIREBASE_AUTH_DOMAIN || 
               process.env.VITE_FIREBASE_AUTH_DOMAIN || 
               `${process.env.FIREBASE_PROJECT_ID || process.env.VITE_FIREBASE_PROJECT_ID}.firebaseapp.com`,
    projectId: process.env.FIREBASE_PROJECT_ID || process.env.VITE_FIREBASE_PROJECT_ID,
    storageBucket: process.env.FIREBASE_STORAGE_BUCKET || 
                  process.env.VITE_FIREBASE_STORAGE_BUCKET || 
                  `${process.env.FIREBASE_PROJECT_ID || process.env.VITE_FIREBASE_PROJECT_ID}.appspot.com`,
    messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID || process.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '',
    appId: process.env.FIREBASE_APP_ID || process.env.VITE_FIREBASE_APP_ID || '',
    measurementId: process.env.FIREBASE_MEASUREMENT_ID || process.env.VITE_FIREBASE_MEASUREMENT_ID || ''
  };
} else {
  // Fall back to config file
  try {
    console.log('Using Firebase configuration from firebaseConfig.js');
    firebaseConfig = require('../firebaseConfig').default || require('../firebaseConfig');
  } catch (error) {
    console.error('Error loading Firebase configuration:', error);
    console.error('Please provide Firebase configuration either through environment variables or firebaseConfig.js');
    process.exit(1);
  }
}

// Admin credentials
const adminEmail = 'admin@admin.com';
const adminPassword = 'admin123';

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

// Set persistence for longer sessions
setPersistence(auth, browserLocalPersistence)
  .then(() => {
    console.log('Authentication persistence set to local');
  })
  .catch((error) => {
    console.warn('Warning: Could not set persistence:', error.message);
    console.log('Continuing with login anyway...');
  });

/**
 * Log in as admin
 */
async function loginAsAdmin() {
  console.log(`Attempting to log in as admin user (${adminEmail})...`);
  
  try {
    const userCredential = await signInWithEmailAndPassword(auth, adminEmail, adminPassword);
    const user = userCredential.user;
    
    console.log('\n✓ Successfully logged in as admin!\n');
    console.log('User details:');
    console.log(`- Email: ${user.email}`);
    console.log(`- UID: ${user.uid}`);
    console.log(`- Email verified: ${user.emailVerified}`);

    // Get the authentication token
    const token = await user.getIdToken();
    console.log('\nAuthentication Token (for API calls):');
    console.log(token.substring(0, 15) + '...' + token.substring(token.length - 10));
    
    // Save token to a temporary file for other scripts to use
    const fs = require('fs');
    const tokenFile = './admin-token.temp.txt';
    
    try {
      fs.writeFileSync(tokenFile, token);
      console.log(`\nToken saved to ${tokenFile} for use by other scripts`);
      console.log('Note: This file contains sensitive information and should not be committed to source control.');
    } catch (error) {
      console.warn(`Warning: Could not save token to file: ${error.message}`);
    }
    
    console.log('\nYou can now run other database scripts with admin privileges.');
    
    return user;
  } catch (error) {
    console.error('\n❌ Failed to log in as admin:');
    console.error(`- Error code: ${error.code}`);
    console.error(`- Message: ${error.message}`);
    
    // Give helpful advice based on error
    if (error.code === 'auth/user-not-found') {
      console.log('\nThe admin user does not exist. Try running the populateDatabase.js script first:');
      console.log('node populateDatabase.js');
    } else if (error.code === 'auth/wrong-password') {
      console.log('\nThe admin password may have been changed. Check your credentials.');
    } else if (error.code === 'auth/network-request-failed') {
      console.log('\nNetwork error. Check your internet connection and Firebase project configuration.');
    }
    
    process.exit(1);
  }
}

// Run the script
loginAsAdmin().then(() => {
  // Keep the process alive for a moment to ensure Firebase operations complete
  setTimeout(() => {
    console.log('Login process complete.');
  }, 2000);
});
