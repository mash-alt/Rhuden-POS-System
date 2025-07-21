/**
 * clearDatabaseBatch.js
 * 
 * This script clears all documents from specified Firestore collections using batch processing
 * for better efficiency with large collections. User accounts are preserved.
 * 
 * Usage:
 * 1. Run this script directly with Node.js:
 *    node clearDatabaseBatch.js
 * 
 * Note: This is a destructive operation. Use with caution.
 */

const { initializeApp } = require('firebase/app');
const { getAuth, signInWithEmailAndPassword } = require('firebase/auth');
const { 
  getFirestore, 
  collection, 
  getDocs, 
  writeBatch,
  query, 
  limit 
} = require('firebase/firestore');
const fs = require('fs');

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

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// Admin credentials
const adminEmail = 'admin@admin.com';
const adminPassword = 'admin123';

/**
 * Try to authenticate as admin
 * First tries to use saved token, then tries to sign in
 */
async function authenticateAsAdmin() {
  console.log('Authenticating as admin...');
  
  // Try to read token from file first
  try {
    const tokenFile = './admin-token.temp.txt';
    if (fs.existsSync(tokenFile)) {
      console.log('Found admin token file, using existing authentication');
      return;
    }
  } catch (error) {
    // Token file not found or not readable, continue with login
  }
  
  // If no token file, try to sign in
  try {
    console.log(`Signing in as admin user (${adminEmail})...`);
    const userCredential = await signInWithEmailAndPassword(auth, adminEmail, adminPassword);
    console.log(`✓ Successfully signed in as ${userCredential.user.email}`);
  } catch (error) {
    console.error(`❌ Authentication error: ${error.code} - ${error.message}`);
    console.error('Please run the admin-login script first: node adminLogin.js');
    process.exit(1);
  }
}

// Collections to clear (all except users)
const collections = [
  'products',
  'categories',
  'suppliers',
  'inventory',
  'sales',
  'payments',
  'customers',
  'stockMovements',
  'creditAgreements'
];

// Batch size - Firestore has a limit of 500 operations per batch
const BATCH_SIZE = 400;

/**
 * Clear a collection using batch operations
 * @param {string} collectionName - Name of the collection to clear
 * @returns {number} - Number of documents deleted
 */
async function clearCollection(collectionName) {
  console.log(`Clearing collection: ${collectionName}...`);
  const collectionRef = collection(db, collectionName);
  
  let totalDeleted = 0;
  let batchCount = 0;
  
  // Process in batches
  while (true) {
    const q = query(collectionRef, limit(BATCH_SIZE));
    const snapshot = await getDocs(q);
    
    // If no documents left, we're done
    if (snapshot.empty) {
      break;
    }
    
    // Create a new batch
    const batch = writeBatch(db);
    
    // Add each document to the batch
    snapshot.docs.forEach((doc) => {
      batch.delete(doc.ref);
      totalDeleted++;
    });
    
    // Commit the batch
    await batch.commit();
    
    batchCount++;
    console.log(`  Batch ${batchCount}: Deleted ${snapshot.size} documents from ${collectionName}`);
    
    // If we got less than the batch size, we're done
    if (snapshot.size < BATCH_SIZE) {
      break;
    }
  }
  
  return totalDeleted;
}

/**
 * Clear all specified collections
 */
async function clearAllCollections() {
  console.log('Starting database clearing operation with batch processing...');
  console.log('WARNING: This will delete all data except user accounts!');
  
  // Authenticate as admin first
  await authenticateAsAdmin();
  
  // Ask for confirmation before proceeding
  const readline = require('readline').createInterface({
    input: process.stdin,
    output: process.stdout
  });

  const confirmation = await new Promise(resolve => {
    readline.question('Type "DELETE" to confirm: ', answer => {
      readline.close();
      resolve(answer);
    });
  });

  if (confirmation !== 'DELETE') {
    console.log('Operation cancelled. No documents were deleted.');
    process.exit(0);
  }

  // Track stats
  let totalDeleted = 0;
  const stats = {};

  // Process each collection
  for (const collectionName of collections) {
    try {
      const deletedCount = await clearCollection(collectionName);
      stats[collectionName] = deletedCount;
      totalDeleted += deletedCount;
      console.log(`✓ Deleted ${deletedCount} documents from ${collectionName}`);
    } catch (error) {
      console.error(`Error clearing collection ${collectionName}:`, error);
    }
  }

  // Print summary
  console.log('\n=== Database Clearing Summary ===');
  console.log(`Total documents deleted: ${totalDeleted}`);
  console.log('Deleted documents per collection:');
  
  for (const [collection, count] of Object.entries(stats)) {
    console.log(`  ${collection}: ${count}`);
  }
  
  console.log('\nDatabase clearing completed.');
}

// Run the script
clearAllCollections().catch(error => {
  console.error('An error occurred during database clearing:', error);
  process.exit(1);
});
