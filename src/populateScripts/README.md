# Database Population Scripts

This folder contains scripts to populate the Firestore database with initial data for the construction POS/Inventory system.

## Files

- `populateDatabase.js` - Main script to populate categories, suppliers, products, and create admin user
- `populateProducts.js` - Contains Firestore security rules comments for reference

## Usage

### Prerequisites

1. Make sure your Firebase project is set up and configured
2. Set up environment variables (preferred) or ensure Firebase configuration in the scripts matches your project
3. Install Node.js dependencies if running as a standalone script

### Environment Variables Setup

1. Copy the `.env.example` file to `.env` in the project root:
   ```bash
   cp ../../.env.example ../../.env
   ```

2. Edit the `.env` file with your Firebase project credentials:
   ```
   # For Node.js scripts
   FIREBASE_API_KEY=your-api-key
   FIREBASE_PROJECT_ID=your-project-id
   # (and other Firebase variables)

   # For Vite frontend (same values with VITE_ prefix)
   VITE_FIREBASE_API_KEY=your-api-key
   VITE_FIREBASE_PROJECT_ID=your-project-id
   # (and other Vite Firebase variables)
   ```

### Running the Population Script

#### Option 1: Using Node.js directly
```bash
cd src/populateScripts
node populateDatabase.js
```

#### Option 2: From project root (if npm script is added)
```bash
npm run populate-db
```

### Clearing the Database

This folder also contains scripts to clear the Firestore database while preserving user accounts.

#### Option 1: Using Node.js directly
```bash
cd src/populateScripts
node clearDatabase.js          # Standard version
node clearDatabaseBatch.js     # Batch version (more efficient for large collections)
```

#### Option 2: Using npm scripts from this directory
```bash
cd src/populateScripts
npm install
npm run clear          # Standard version
npm run clear-batch    # Batch version
```

#### Option 3: From project root
```bash
npm run clear-db          # Standard version
npm run clear-db-batch    # Batch version
npm run clear-db-auth     # Integrated version with admin authentication
npm run clear-db-preserve # Preserves collection structure with template documents
```

Note: All scripts will prompt for confirmation before deleting any data.

#### Recommended Script Options

1. **For Complete Cleanup with Authentication**: Use the integrated script
   ```bash
   npm run clear-db-auth
   ```
   This combines admin login and database clearing in one operation.

2. **To Preserve Collection Structure**: Use the structure-preserving script
   ```bash
   npm run clear-db-preserve
   ```
   This script:
   - Clears all documents from each collection
   - Adds one template document to each collection to preserve structure
   - Ensures your app doesn't break due to missing collections

```bash
npm run clear-db-auth
```

This is the recommended approach as it automatically:
1. Logs in as admin with proper credentials
2. Uses batch operations for efficient deletion
3. Preserves user accounts
4. Handles authentication errors gracefully

### Logging in as Admin

If you encounter "insufficient permissions" errors, you can use the admin login script:

#### Option 1: Using Node.js directly
```bash
cd src/populateScripts
node adminLogin.js
```

#### Option 2: Using npm scripts
```bash
cd src/populateScripts
npm run admin-login
```

#### Option 3: From project root
```bash
npm run admin-login
```

This script will:
1. Log in using the default admin credentials (admin@admin.com / admin123)
2. Display the authentication token
3. Save the token to a temporary file for use by other scripts

## What gets created

### Admin User
- **Email**: admin@admin.com
- **Password**: admin123
- **Role**: admin
- **Name**: System Administrator

### Categories (10)
1. Steel & Metal
2. Concrete & Cement
3. Safety Equipment
4. Power Tools
5. Hardware
6. Lumber & Wood
7. Electrical
8. Plumbing
9. Heavy Equipment
10. Building Materials

### Suppliers (10)
1. Steel Corp Industries
2. ConcreteMax Supply
3. SafetyFirst Equipment
4. PowerTool Warehouse
5. Hardware Plus
6. Lumber Solutions
7. ElectricPro Supply
8. PlumbMax Distributors
9. Heavy Equipment Rentals
10. BuildMart Supplies

### Products (10)
Each product includes:
- Name, SKU, price, cost
- Category and supplier references
- Stock quantity and reorder levels
- Units of measurement
- Active status and creation timestamp

## Firebase Security Rules

The `populateProducts.js` file contains comprehensive Firestore security rules that should be applied to your Firebase project. These rules ensure:

- Users can only access their own user documents
- Authenticated users can read product/category/supplier data
- Only admins can write to products/categories/suppliers
- Proper role-based access control

## Important Notes

- The script will create an admin user if it doesn't exist
- If the admin user already exists, it will sign in instead
- All data creation includes proper error handling
- Products are linked to categories and suppliers via Firestore references
- Stock quantities and reorder levels are included for inventory management

## Troubleshooting

### Authentication Errors
1. Make sure your Firebase configuration is correct
2. Ensure your Firebase project has Authentication enabled
3. Check that Firestore is enabled and configured
4. Verify the security rules are properly set up

### Permission Errors
1. Check that the Firestore security rules are applied
2. Ensure the admin user was created successfully
3. Verify the user has the correct role in Firestore
4. Try logging in as admin using the admin login script:
   ```bash
   npm run admin-login
   ```
   This will authenticate you with admin privileges

### Environment Variable Issues
1. Make sure your `.env` file exists in the project root
2. Check that all required Firebase variables are set
3. Try using the absolute path to the `.env` file:
   ```
   require('dotenv').config({ path: '/absolute/path/to/.env' });
   ```
4. If using environment variables doesn't work, the scripts will fall back to using the configuration from `../firebaseConfig.js`
