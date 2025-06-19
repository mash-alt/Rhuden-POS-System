# Rhuden Construction POS & Inventory Management System

## 📋 Table of Contents
1. [Overview](#overview)
2. [Features](#features)
3. [User Authentication & Privileges](#user-authentication--privileges)
4. [System Components](#system-components)
5. [Getting Started](#getting-started)
6. [User Guide](#user-guide)
7. [Technical Architecture](#technical-architecture)
8. [Deployment](#deployment)
9. [Troubleshooting](#troubleshooting)

---

## 🏢 Overview

The Rhuden Construction POS & Inventory Management System is a comprehensive web-based application designed for construction businesses to manage their inventory, process sales transactions, track payments, and monitor business performance in real-time.

### Key Capabilities
- **Point of Sale (POS)** - Process cash and credit sales with receipt generation
- **Inventory Management** - Track products, categories, suppliers, and stock levels
- **Customer Management** - Handle customer accounts and credit balances
- **Payment Tracking** - Record and manage various payment methods
- **Business Analytics** - Real-time dashboard with key performance metrics
- **Transaction History** - Complete audit trail of all business activities

---

## ✨ Features

### 🛒 Point of Sale
- **Multi-item transactions** with real-time total calculation
- **Dual payment modes**: Cash sales and Credit sales
- **Partial payment support** for credit transactions
- **Customer selection** for credit sales
- **Receipt generation** with transaction details
- **Inventory integration** with automatic stock deduction

### 📦 Inventory Management
- **Product catalog** with SKU, pricing, and stock tracking
- **Category organization** for better product classification
- **Supplier management** with contact information
- **Low stock alerts** with configurable reorder levels
- **Active/Inactive status** for product lifecycle management
- **Stock movement tracking** with detailed audit trail

### 👥 Customer Management
- **Customer profiles** with contact information
- **Credit account management** with outstanding balance tracking
- **Payment history** linked to customer accounts
- **Credit limit monitoring** and balance calculations

### 💰 Payment Processing
- **Multiple payment methods**: Cash, Credit Card, Bank Transfer, Check
- **Partial payment support** for credit sales
- **Payment allocation** to specific sales transactions
- **Outstanding balance tracking** and management

### 📊 Business Analytics
- **Real-time dashboard** with key performance indicators
- **Date-filtered metrics** (Today, Yesterday, Week, Month, All Time)
- **Sales revenue tracking** and payment monitoring
- **Inventory valuation** (Cost vs Retail value)
- **Low stock alerts** and business notifications
- **Recent activity feeds** for sales and payments

---

## 🔐 User Authentication & Privileges

### Authentication System
The application uses **Firebase Authentication** for secure user management with email/password authentication.

### User Roles & Privileges

#### 🔑 Staff User (Default Role)
**Access Level**: Full System Access

**Privileges**:
- ✅ **Dashboard Access** - View all business metrics and analytics
- ✅ **POS Operations** - Process cash and credit sales
- ✅ **Inventory Management** - Add, edit, and manage products, categories, suppliers
- ✅ **Customer Management** - Create and manage customer accounts
- ✅ **Payment Processing** - Record and manage payments
- ✅ **Transaction History** - View all sales and payment records
- ✅ **Stock Management** - Update inventory levels and track movements

**Restrictions**:
- ❌ Cannot access system administration features
- ❌ Cannot modify user accounts or permissions

#### 🛡️ Protected Routes
All main application features require authentication:
- `/dashboard` - Business dashboard and analytics
- `/inventory` - Product, category, and supplier management
- `/pos` - Point of sale operations
- `/transactions` - Transaction history and payment records

#### 🌐 Public Routes
- `/login` - User authentication
- `/register` - New user registration (if enabled)

### Session Management
- **Automatic logout** on session expiration
- **Secure session handling** with Firebase Auth tokens
- **Route protection** - Unauthenticated users redirected to login
- **Persistent sessions** - Users remain logged in across browser sessions

---

## 🧩 System Components

### Frontend Components

#### 📊 Dashboard
- **Metrics Cards**: Sales revenue, payments received, outstanding amounts, inventory value
- **Quick Actions**: Fast navigation to key functions
- **Alerts System**: Low stock notifications and credit account alerts
- **Recent Activities**: Latest sales and payment transactions
- **Business Summary**: Overall business statistics and performance indicators

#### 🛒 Point of Sale (POS)
- **Product Selection**: Search and add products to cart
- **Cart Management**: Quantity adjustment and item removal
- **Customer Selection**: Choose customer for credit sales
- **Payment Processing**: Cash and credit transaction handling
- **Receipt Generation**: Transaction confirmation and details

#### 📦 Inventory Management
- **Product Management**: CRUD operations for products with detailed information
- **Category Management**: Organize products into logical groups
- **Supplier Management**: Maintain supplier contact and relationship data
- **Stock Movements**: Track all inventory changes with audit trail
- **Low Stock Monitoring**: Automated alerts for reorder management

#### 💳 Transaction History
- **Sales Records**: Complete transaction history with filtering
- **Payment Tracking**: All payment records with allocation details
- **Status Indicators**: Paid, Partial, Pending transaction status
- **Search & Filter**: Date range and status-based filtering

### Backend Services

#### 🔥 Firebase Integration
- **Firestore Database**: Real-time data storage and synchronization
- **Authentication**: Secure user management and session handling
- **Hosting**: Web application deployment and hosting

#### 📱 Real-time Data Hooks
- **useProducts**: Product data management and CRUD operations
- **useCategories**: Category data handling
- **useSuppliers**: Supplier information management
- **useSales**: Sales transaction processing
- **usePayments**: Payment record management
- **useCustomers**: Customer account handling
- **useStockMovements**: Inventory tracking and audit

---

## 🚀 Getting Started

### Prerequisites
- Modern web browser (Chrome, Firefox, Safari, Edge)
- Internet connection for cloud-based features
- Valid user account credentials

### First Time Setup

1. **Access the Application**
   - Navigate to: `https://rhuden-pos-and-inventory.web.app`
   - You'll be automatically redirected to the login page

2. **User Authentication**
   - Enter your email and password
   - Click "Login" to access the system
   - If you don't have an account, contact your administrator

3. **Initial Dashboard View**
   - Upon successful login, you'll see the main dashboard
   - Review the quick start metrics and alerts
   - Familiarize yourself with the navigation menu

### Quick Start Checklist

#### Setting Up Inventory
1. **Add Categories** (Inventory → Categories)
   - Create product categories (e.g., "Tools", "Materials", "Equipment")
   - Add descriptions for better organization

2. **Add Suppliers** (Inventory → Suppliers)
   - Enter supplier contact information
   - Include email, phone, and address details

3. **Add Products** (Inventory → Products)
   - Enter product details (SKU, name, price, cost)
   - Assign to categories and suppliers
   - Set initial stock quantities and reorder levels

#### Setting Up Customers
1. **Add Customer Accounts** (Future feature)
   - Create customer profiles for credit sales
   - Set credit limits and contact information

#### Processing First Sale
1. **Navigate to POS** (Point of Sale)
   - Select products for the transaction
   - Choose payment method (Cash or Credit)
   - For credit sales, select customer account
   - Complete the transaction

---

## 📖 User Guide

### 📊 Dashboard Operations

#### Viewing Business Metrics
- **Date Filtering**: Use the dropdown to filter metrics by time period
- **Metric Cards**: Monitor sales revenue, payments, outstanding amounts, and inventory value
- **Alerts**: Check for low stock items and outstanding customer balances
- **Recent Activities**: Review latest sales and payment transactions

#### Quick Actions
- **New Sale**: Click to navigate directly to POS
- **Manage Inventory**: Quick access to inventory management
- **View Transactions**: Review transaction history
- **Manage Customers**: Access customer account management

### 🛒 POS Operations

#### Processing a Cash Sale
1. **Add Products**: Search and select products for the transaction
2. **Adjust Quantities**: Modify quantities as needed
3. **Review Total**: Verify the transaction total
4. **Select Payment**: Choose "Cash" as payment method
5. **Complete Sale**: Click "Complete Sale" to process

#### Processing a Credit Sale
1. **Add Products**: Select items for the transaction
2. **Choose Customer**: Select customer account for credit sale
3. **Select Payment**: Choose "Credit" as payment method
4. **Complete Sale**: Transaction will be added to customer's account
5. **Partial Payment** (Optional): Add partial payment if customer pays some amount

#### Cart Management
- **Add Items**: Use the product search to add items
- **Remove Items**: Click the remove button (×) next to items
- **Adjust Quantities**: Use the quantity controls to modify amounts
- **Clear Cart**: Remove all items to start over

### 📦 Inventory Management

#### Product Management
1. **Adding Products**:
   - Navigate to Inventory → Products
   - Click "Add Product"
   - Fill in required fields: Name, SKU, Price, Category, Supplier
   - Set optional fields: Cost, Stock Quantity, Reorder Level
   - Save the product

2. **Editing Products**:
   - Click the edit button next to any product
   - Modify the necessary fields
   - Save changes

3. **Managing Stock**:
   - Monitor stock levels in the product table
   - Watch for low stock badges and alerts
   - Update quantities through stock movements

#### Category Management
1. **Creating Categories**:
   - Go to Inventory → Categories
   - Click "Add Category"
   - Enter category name and description
   - Save the category

2. **Organizing Products**:
   - Assign products to categories during creation/editing
   - Use categories to filter and organize product views

#### Supplier Management
1. **Adding Suppliers**:
   - Navigate to Inventory → Suppliers
   - Click "Add Supplier"
   - Enter supplier details: Name, Email, Phone, Address
   - Save supplier information

2. **Managing Relationships**:
   - Assign suppliers to products
   - Track which products come from which suppliers

### 💳 Transaction Management

#### Viewing Sales History
1. **Access Transactions**: Navigate to Transaction History
2. **Filter by Date**: Use date range selectors
3. **Review Details**: Click on transactions to view details
4. **Check Status**: Monitor payment status (Paid, Partial, Pending)

#### Managing Payments
1. **Record Payments**: Access through transaction history
2. **Allocate to Sales**: Link payments to specific sales transactions
3. **Track Methods**: Monitor different payment methods used
4. **Outstanding Balances**: Review and manage unpaid amounts

### 🔧 System Settings

#### User Account Management
- **Profile Settings**: Update personal information
- **Password Changes**: Modify account passwords
- **Session Management**: Monitor active sessions

#### Business Configuration
- **Currency Settings**: Default currency display (₱ - Philippine Peso)
- **Tax Configuration**: Business tax settings
- **Receipt Customization**: Business information for receipts

---

## 🏗️ Technical Architecture

### Frontend Technology Stack
- **React 18**: Modern JavaScript framework for user interfaces
- **TypeScript**: Type-safe JavaScript development
- **React Router**: Client-side routing and navigation
- **Vite**: Fast build tool and development server
- **CSS Modules**: Scoped styling system

### Backend & Database
- **Firebase Firestore**: NoSQL cloud database
- **Firebase Authentication**: User management and security
- **Firebase Hosting**: Web application hosting
- **Real-time Subscriptions**: Live data updates

### Data Models

#### Products
```typescript
interface Product {
  id: string
  sku: string
  name: string
  description?: string
  price: number
  cost?: number
  categoryId: string
  supplierId: string
  stockQuantity?: number
  reorderLevel?: number
  unit?: string
  active: boolean
  createdAt: Timestamp
  updatedAt: Timestamp
}
```

#### Sales
```typescript
interface Sale {
  id: string
  items: SaleItem[]
  total: number
  paymentMethod: 'cash' | 'credit'
  customerId?: string
  creditStatus?: 'paid' | 'partial' | 'pending'
  date: Timestamp
  createdAt: Timestamp
}
```

#### Payments
```typescript
interface Payment {
  id: string
  saleId: string
  customerId?: string
  amount: number
  paymentMethod: 'cash' | 'credit_card' | 'bank_transfer' | 'check'
  date: Timestamp
  notes?: string
  createdAt: Timestamp
}
```

### Security Features
- **Authentication Required**: All routes protected except login/register
- **Data Validation**: Client and server-side input validation
- **Type Safety**: TypeScript ensures type correctness
- **Session Management**: Secure Firebase Auth token handling

---

## 🚀 Deployment

### Production Environment
- **Hosting**: Firebase Hosting
- **Domain**: `https://rhuden-pos-and-inventory.web.app`
- **SSL**: Automatic HTTPS encryption
- **CDN**: Global content delivery network

### Build Process
```bash
# Install dependencies
npm install

# Build for production
npm run build

# Deploy to Firebase
firebase deploy
```

### Environment Configuration
The application uses environment variables for configuration:
- `VITE_FIREBASE_API_KEY`
- `VITE_FIREBASE_AUTH_DOMAIN`
- `VITE_FIREBASE_PROJECT_ID`
- `VITE_FIREBASE_STORAGE_BUCKET`
- `VITE_FIREBASE_MESSAGING_SENDER_ID`
- `VITE_FIREBASE_APP_ID`
- `VITE_FIREBASE_MEASUREMENT_ID`

### Performance Optimization
- **Code Splitting**: Lazy loading for better performance
- **Asset Optimization**: Minified CSS and JavaScript
- **Caching**: Browser and CDN caching strategies
- **Real-time Updates**: Efficient data synchronization

---

## 🔧 Troubleshooting

### Common Issues

#### Authentication Problems
**Issue**: Cannot log in / Session expires quickly
**Solution**: 
- Verify internet connection
- Clear browser cache and cookies
- Check if credentials are correct
- Contact administrator for account issues

#### Data Loading Issues
**Issue**: Dashboard or pages show loading indefinitely
**Solution**:
- Check internet connection
- Refresh the page (Ctrl+F5)
- Clear browser cache
- Verify Firebase project status

#### POS Transaction Errors
**Issue**: Cannot complete sales transactions
**Solution**:
- Ensure products have valid prices
- Check customer selection for credit sales
- Verify inventory availability
- Refresh the page and try again

#### Inventory Sync Issues
**Issue**: Stock levels not updating correctly
**Solution**:
- Check for concurrent users making changes
- Refresh the inventory page
- Verify stock movement records
- Contact support if issues persist

### Browser Compatibility
**Supported Browsers**:
- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

**Not Supported**:
- Internet Explorer
- Browsers with JavaScript disabled

### Performance Tips
1. **Use Modern Browser**: Keep browser updated for best performance
2. **Stable Internet**: Ensure reliable internet connection
3. **Regular Cleanup**: Clear browser cache periodically
4. **Close Unused Tabs**: Free up system resources

### Contact Support
For technical issues or questions:
- **System Administrator**: Contact your internal IT support
- **Application Issues**: Report bugs through your organization's support channel
- **Feature Requests**: Submit through proper business channels

---

## 📚 Appendices

### Keyboard Shortcuts
- **Ctrl + /**: Quick search (when available)
- **Escape**: Close modals/forms
- **Enter**: Submit forms
- **Tab**: Navigate between form fields

### Data Export
Currently, data export features are not implemented but can be added for:
- Sales reports
- Inventory reports
- Customer statements
- Payment summaries

### Integration Possibilities
The system can be extended to integrate with:
- Accounting software (QuickBooks, SAP)
- E-commerce platforms
- Barcode scanners
- Receipt printers
- Payment gateways

### Backup & Recovery
- **Automatic Backups**: Firebase provides automatic data backup
- **Data Recovery**: Contact administrator for data recovery needs
- **Export Options**: Manual data export through Firebase console

---

## 📄 License & Support

This application is developed for Rhuden Construction's internal business operations. For support, feature requests, or technical assistance, contact your system administrator.

**Last Updated**: June 19, 2025
**Version**: 1.0.0
**Documentation Version**: 1.0

---

*This documentation covers the current features and functionality of the Rhuden Construction POS & Inventory Management System. As the system evolves, this documentation will be updated to reflect new features and improvements.*
