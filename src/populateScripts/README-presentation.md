# Presentation Data Setup

This script prepares your database for presentation by:

## What it does:
1. **Clears all data except users** - Removes all products, sales, customers, etc. but preserves user accounts
2. **Adds realistic demo data** including:
   - 7 construction material categories
   - 5 realistic suppliers (Philippines-based)
   - 5 customers with varying credit balances
   - 12 construction products (cement, steel, lumber, etc.)
   - 30 days of realistic sales transactions
   - Payment records with various methods (cash, GCash, credit)
   - Stock movement history

## How to run:

```bash
npm run prepare-presentation
```

## Demo Data Includes:

### Categories:
- Cement & Concrete
- Steel & Rebar  
- Lumber & Wood
- Roofing Materials
- Electrical Supplies
- Plumbing Supplies
- Hardware & Tools

### Sample Products:
- Portland Cement Type I
- Deformed Steel Bar 12mm
- Coco Lumber 2x4x10
- Galvanized Iron Sheet 26 Gauge
- Marine Plywood 4x8 ft
- And more...

### Sample Customers:
- ABC Construction Inc. (₱125,000 credit balance)
- Golden Homes Development (₱75,000 credit balance)
- Metro Infrastructure Corp (₱250,000 credit balance)
- Villa Santos Construction (₱50,000 credit balance)
- Rodriguez Family Residence (₱0 credit balance)

### Sales Data:
- 30 days of transaction history
- Mix of cash, GCash, and credit sales
- Realistic quantities and pricing
- Various payment statuses for credit sales

## Perfect for demonstrating:
- ✅ Inventory management
- ✅ Sales processing  
- ✅ Credit payment handling
- ✅ Customer management
- ✅ Supplier tracking
- ✅ Stock movement history
- ✅ Dashboard analytics
- ✅ Transaction history

## Warning:
⚠️ This script will **DELETE ALL DATA** except user accounts. Make sure you want to reset your database before running it.

## After running:
Your database will be ready for a professional presentation with realistic construction industry data!
