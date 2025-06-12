# Database Population Scripts

This folder contains scripts to populate the Firestore database with initial data for the construction POS/Inventory system.

## Files

- `populateDatabase.js` - Main script to populate categories, suppliers, products, and create admin user
- `populateProducts.js` - Contains Firestore security rules comments for reference

## Usage

### Prerequisites

1. Make sure your Firebase project is set up and configured
2. Ensure the Firebase configuration in `populateDatabase.js` matches your project
3. Install Node.js dependencies if running as a standalone script

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

If you encounter authentication errors:
1. Make sure your Firebase configuration is correct
2. Ensure your Firebase project has Authentication enabled
3. Check that Firestore is enabled and configured
4. Verify the security rules are properly set up

If you get permission errors:
1. Check that the Firestore security rules are applied
2. Ensure the admin user was created successfully
3. Verify the user has the correct role in Firestore
