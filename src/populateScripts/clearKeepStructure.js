/**
 * clearKeepStructure.js
 * 
 * This script clears all documents from specified collections while preserving:
 * 1. User accounts (entire users collection is preserved)
 * 2. Collection structure (by adding one empty document to each collection)
 * 
 * This ensures that collection references and structures remain valid in the application.
 * 
 * Usage:
 * 1. Run this script directly with Node.js:
 *    node clearKeepStructure.js
 * 
 * Note: This is a destructive operation. Use with caution.
 */

const { initializeApp } = require('firebase/app');
const { 
  getAuth, 
  signInWithEmailAndPassword,
  setPersistence,
  browserLocalPersistence
} = require('firebase/auth');
const { 
  getFirestore, 
  collection, 
  getDocs, 
  deleteDoc, 
  writeBatch,
  query, 
  limit,
  doc,
  setDoc,
  serverTimestamp
} = require('firebase/firestore');

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

// Collection template documents (minimal structure to maintain app functionality)
const templateDocuments = {
  products: {
    name: '✓ Collection Preserved',
    sku: 'TEMPLATE-PRODUCT',
    price: 0,
    cost: 0,
    stock: 0,
    description: 'This is a template document to preserve the collection structure',
    active: false,
    createdAt: serverTimestamp()
  },
  categories: {
    name: '✓ Collection Preserved',
    description: 'This is a template document to preserve the collection structure',
    active: false,
    createdAt: serverTimestamp()
  },
  suppliers: {
    name: '✓ Collection Preserved',
    contact: 'Template',
    phone: '000-000-0000',
    email: 'template@example.com',
    active: false,
    createdAt: serverTimestamp()
  },
  inventory: {
    productId: 'template',
    quantity: 0,
    location: 'Template',
    notes: 'This is a template document to preserve the collection structure',
    lastUpdated: serverTimestamp()
  },
  sales: {
    orderNumber: 'TEMPLATE-SALE',
    customerName: 'Template Customer',
    total: 0,
    status: 'template',
    items: [],
    createdAt: serverTimestamp()
  },
  payments: {
    saleId: 'template',
    amount: 0,
    method: 'template',
    status: 'template',
    createdAt: serverTimestamp()
  },
  customers: {
    name: 'Template Customer',
    phone: '000-000-0000',
    email: 'template@example.com',
    createdAt: serverTimestamp()
  },
  stockMovements: {
    productId: 'template',
    type: 'template',
    quantity: 0,
    notes: 'This is a template document to preserve the collection structure',
    createdAt: serverTimestamp()
  },
  creditAgreements: {
    customerId: 'template',
    amount: 0,
    status: 'template',
    dueDate: serverTimestamp(),
    createdAt: serverTimestamp()
  }
};

// Batch size - Firestore has a limit of 500 operations per batch
const BATCH_SIZE = 400;

/**
 * Log in as admin
 */
async function loginAsAdmin() {
  console.log(`Authenticating as admin user (${adminEmail})...`);
  
  try {
    // Set persistence for longer sessions
    try {
      await setPersistence(auth, browserLocalPersistence);
    } catch (error) {
      console.warn('Warning: Could not set persistence:', error.message);
      console.log('Continuing with login anyway...');
    }

    // Sign in with email and password
    const userCredential = await signInWithEmailAndPassword(auth, adminEmail, adminPassword);
    const user = userCredential.user;
    
    console.log(`✓ Successfully logged in as ${user.email}`);
    
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

/**
 * Clear a collection using batch operations but keep the structure
 * @param {string} collectionName - Name of the collection to clear
 * @returns {number} - Number of documents deleted
 */
async function clearCollectionKeepStructure(collectionName) {
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
    snapshot.docs.forEach((document) => {
      batch.delete(document.ref);
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
  
  // Add a template document to preserve the collection structure
  try {
    const templateDocRef = doc(db, collectionName, 'template');
    await setDoc(templateDocRef, templateDocuments[collectionName] || { 
      name: 'Template', 
      createdAt: serverTimestamp(),
      description: 'This is a template document to preserve the collection structure' 
    });
    console.log(`  ✓ Added template document to preserve ${collectionName} collection structure`);
  } catch (error) {
    console.error(`  ❌ Error adding template document to ${collectionName}:`, error);
  }
  
  return totalDeleted;
}

/**
 * Clear all specified collections but keep the structure
 */
async function clearAllCollectionsKeepStructure() {
  console.log('Starting database clearing operation (preserving structure)...');
  console.log('WARNING: This will delete all data except user accounts and will add template documents!');
  
  // Ask for confirmation before proceeding
  const readline = require('readline').createInterface({
    input: process.stdin,
    output: process.stdout
  });

  const confirmation = await new Promise(resolve => {
    readline.question('Type "PRESERVE" to confirm: ', answer => {
      readline.close();
      resolve(answer);
    });
  });

  if (confirmation !== 'PRESERVE') {
    console.log('Operation cancelled. No documents were deleted.');
    process.exit(0);
  }

  // Track stats
  let totalDeleted = 0;
  const stats = {};

  // Process each collection
  for (const collectionName of collections) {
    try {
      const deletedCount = await clearCollectionKeepStructure(collectionName);
      stats[collectionName] = deletedCount;
      totalDeleted += deletedCount;
      console.log(`✓ Processed ${collectionName}: Deleted ${deletedCount} documents and added template`);
    } catch (error) {
      console.error(`Error processing collection ${collectionName}:`, error);
    }
  }

  // Print summary
  console.log('\n=== Database Structure Preservation Summary ===');
  console.log(`Total documents deleted: ${totalDeleted}`);
  console.log(`Template documents added: ${collections.length}`);
  console.log('Deleted documents per collection:');
  
  for (const [collection, count] of Object.entries(stats)) {
    console.log(`  ${collection}: ${count} (+ 1 template document)`);
  }
  
  console.log('\nDatabase clearing with structure preservation completed.');
  console.log('Note: Each collection now contains one template document to maintain structure.');
}

// Run the script with authentication
async function main() {
  try {
    // First log in as admin
    await loginAsAdmin();
    
    // Then clear collections but preserve structure
    await clearAllCollectionsKeepStructure();
  } catch (error) {
    console.error('An error occurred:', error);
    process.exit(1);
  }
}

// Start the process
main();
