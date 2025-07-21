# Database Management Scripts

This directory contains scripts for managing the database in your development environment.

## Scripts

### clearDatabase.js

Clears all documents from the database collections while preserving user accounts.

**Usage:**
```bash
node clearDatabase.js
```

This script will:
1. Connect to your Firebase project using the configuration in `firebaseConfig.js`
2. Ask for confirmation by typing "DELETE"
3. Delete all documents from these collections:
   - products
   - categories
   - suppliers
   - inventory
   - sales
   - payments
   - customers
   - stockMovements
   - creditAgreements
4. Display a summary of deleted documents

### clearDatabaseBatch.js

An optimized version of the database clearing script that uses batch operations. 
This is more efficient for large collections.

**Usage:**
```bash
node clearDatabaseBatch.js
```

## ⚠️ Warning

These scripts will permanently delete data. They are intended for development and testing purposes only.

## Requirements

- Node.js installed on your system
- Firebase project configuration (one of the following):
  - Environment variables (see `.env.example`)
  - Firebase config in `../firebaseConfig.js`

## Setting Up Environment Variables

For better security, you can use environment variables instead of the config file:

1. Copy the `.env.example` file to `.env` in the src directory:
   ```bash
   cp ../.env.example ../.env
   ```

2. Edit the `.env` file and add your Firebase credentials:
   ```
   # For Node.js scripts
   FIREBASE_API_KEY=your-api-key-here
   FIREBASE_PROJECT_ID=your-project-id
   
   # For Vite frontend (same values with VITE_ prefix)
   VITE_FIREBASE_API_KEY=your-api-key-here
   VITE_FIREBASE_PROJECT_ID=your-project-id
   ```
   
   Note: The database scripts will check for both formats (with and without the VITE_ prefix).

3. Install required dependencies:
   ```bash
   npm install
   ```

## Troubleshooting

If you encounter a module import error, you might need to create a package.json file in this directory and set "type": "module" for ES modules support, or ensure you're using the CommonJS version of the script.
