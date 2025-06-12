// Firebase Admin SDK initialization and database population script
import { initializeApp } from 'firebase/app';
import { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';
import { getFirestore, collection, addDoc, doc, setDoc, connectFirestoreEmulator } from 'firebase/firestore';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Firebase configuration using environment variables
const firebaseConfig = {
  apiKey: process.env.VITE_FIREBASE_API_KEY,
  authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.VITE_FIREBASE_APP_ID,
  measurementId: process.env.VITE_FIREBASE_MEASUREMENT_ID
};

// Validate required environment variables
const requiredEnvVars = [
  'VITE_FIREBASE_API_KEY',
  'VITE_FIREBASE_AUTH_DOMAIN', 
  'VITE_FIREBASE_PROJECT_ID',
  'VITE_FIREBASE_STORAGE_BUCKET',
  'VITE_FIREBASE_MESSAGING_SENDER_ID',
  'VITE_FIREBASE_APP_ID'
];

for (const envVar of requiredEnvVars) {
  if (!process.env[envVar]) {
    console.error(`❌ Missing required environment variable: ${envVar}`);
    process.exit(1);
  }
}

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// Uncomment if using Firebase emulator
// connectFirestoreEmulator(db, 'localhost', 8080);

// Sample Categories Data
const categories = [
  { name: "Steel & Metal", description: "Steel beams, rebar, metal sheets and structural steel" },
  { name: "Concrete & Cement", description: "Ready-mix concrete, cement bags, and concrete additives" },
  { name: "Safety Equipment", description: "Hard hats, safety vests, gloves, and protective gear" },
  { name: "Power Tools", description: "Drills, saws, grinders, and electric power tools" },
  { name: "Hardware", description: "Bolts, screws, nails, and fastening hardware" },
  { name: "Lumber & Wood", description: "Treated lumber, plywood, and wood materials" },
  { name: "Electrical", description: "Wiring, conduits, outlets, and electrical components" },
  { name: "Plumbing", description: "Pipes, fittings, valves, and plumbing supplies" },
  { name: "Heavy Equipment", description: "Excavators, bulldozers, and construction machinery" },
  { name: "Building Materials", description: "Drywall, insulation, roofing, and general building supplies" }
];

// Sample Suppliers Data
const suppliers = [
  {
    name: "Steel Corp Industries",
    phone: "(555) 123-4567",
    email: "orders@steelcorp.com",
    address: "1234 Industrial Blvd, Steel City, SC 12345",
    notes: "Primary steel and metal supplier. 30-day payment terms."
  },
  {
    name: "ConcreteMax Supply",
    phone: "(555) 234-5678", 
    email: "sales@concretemax.com",
    address: "5678 Concrete Ave, Mix Town, MT 23456",
    notes: "Ready-mix concrete specialist. Same-day delivery available."
  },
  {
    name: "SafetyFirst Equipment",
    phone: "(555) 345-6789",
    email: "info@safetyfirst.com", 
    address: "9012 Safety St, Protect City, PC 34567",
    notes: "OSHA compliant safety equipment. Bulk discounts available."
  },
  {
    name: "PowerTool Warehouse",
    phone: "(555) 456-7890",
    email: "support@powertool.com",
    address: "3456 Tool Dr, Equipment Town, ET 45678",
    notes: "Professional grade power tools. Extended warranties available."
  },
  {
    name: "Hardware Plus",
    phone: "(555) 567-8901",
    email: "orders@hardwareplus.com",
    address: "7890 Hardware Ln, Fastener City, FC 56789",
    notes: "Complete hardware selection. Small orders welcome."
  },
  {
    name: "Lumber Solutions",
    phone: "(555) 678-9012",
    email: "sales@lumbersolutions.com",
    address: "1357 Wood Way, Timber Town, TT 67890",
    notes: "Sustainable lumber supplier. Custom cutting available."
  },
  {
    name: "ElectricPro Supply",
    phone: "(555) 789-0123",
    email: "orders@electricpro.com",
    address: "2468 Electric Blvd, Wire City, WC 78901",
    notes: "Licensed electrical supplier. Emergency stock available."
  },
  {
    name: "PlumbMax Distributors",
    phone: "(555) 890-1234",
    email: "info@plumbmax.com",
    address: "1357 Pipe St, Flow Town, FT 89012",
    notes: "Commercial plumbing specialist. Installation services available."
  },
  {
    name: "Heavy Equipment Rentals",
    phone: "(555) 901-2345",
    email: "rentals@heavyequip.com",
    address: "8642 Machine Ave, Equipment City, EC 90123",
    notes: "Equipment rental and sales. Certified operators available."
  },
  {
    name: "BuildMart Supplies",
    phone: "(555) 012-3456",
    email: "orders@buildmart.com",
    address: "9753 Builder Rd, Construction City, CC 01234",
    notes: "One-stop building supplies. Contractor pricing available."
  }
];

// Function to create admin user
async function createAdminUser() {
  try {
    console.log('Creating admin user...');
    
    // Create the user with Firebase Auth
    const userCredential = await createUserWithEmailAndPassword(auth, 'admin@admin.com', 'admin123');
    const user = userCredential.user;
    
    // Create user document in Firestore with admin role
    await setDoc(doc(db, 'users', user.uid), {
      uid: user.uid,
      name: 'System Administrator',
      role: 'admin',
      email: 'admin@admin.com'
    });
    
    console.log('✅ Admin user created successfully');
    return user;
  } catch (error) {
    if (error.code === 'auth/email-already-in-use') {
      console.log('📝 Admin user already exists, signing in...');
      const userCredential = await signInWithEmailAndPassword(auth, 'admin@admin.com', 'admin123');
      return userCredential.user;
    } else {
      console.error('❌ Error creating admin user:', error);
      throw error;
    }
  }
}

// Function to populate categories
async function populateCategories() {
  console.log('📦 Populating categories...');
  const categoryRefs = [];
  
  for (const category of categories) {
    try {
      const docRef = await addDoc(collection(db, 'categories'), category);
      categoryRefs.push(docRef);
      console.log(`✅ Created category: ${category.name}`);
    } catch (error) {
      console.error(`❌ Error creating category ${category.name}:`, error);
    }
  }
  
  return categoryRefs;
}

// Function to populate suppliers
async function populateSuppliers() {
  console.log('🏢 Populating suppliers...');
  const supplierRefs = [];
  
  for (const supplier of suppliers) {
    try {
      const docRef = await addDoc(collection(db, 'suppliers'), supplier);
      supplierRefs.push(docRef);
      console.log(`✅ Created supplier: ${supplier.name}`);
    } catch (error) {
      console.error(`❌ Error creating supplier ${supplier.name}:`, error);
    }
  }
  
  return supplierRefs;
}

// Function to populate products
async function populateProducts(categoryRefs, supplierRefs) {
  console.log('🔧 Populating products...');
  
  const products = [
    {
      name: "Steel I-Beam 20ft",
      sku: "STL-BEAM-20",
      price: 299.99,
      cost: 225.00,
      description: "Heavy-duty steel I-beam for structural construction",
      categoryId: categoryRefs[0], // Steel & Metal
      supplierId: supplierRefs[0], // Steel Corp Industries
      stockQuantity: 25,
      reorderLevel: 5,
      unit: "piece",
      active: true,
      createdAt: new Date()
    },
    {
      name: "Ready-Mix Concrete 50lb",
      sku: "CON-MIX-50",
      price: 8.75,
      cost: 6.50,
      description: "Premium concrete mix for foundation work",
      categoryId: categoryRefs[1], // Concrete & Cement
      supplierId: supplierRefs[1], // ConcreteMax Supply
      stockQuantity: 150,
      reorderLevel: 20,
      unit: "bag",
      active: true,
      createdAt: new Date()
    },
    {
      name: "Safety Helmet",
      sku: "SAF-HLM-001",
      price: 24.99,
      cost: 18.00,
      description: "OSHA compliant safety helmet with adjustable strap",
      categoryId: categoryRefs[2], // Safety Equipment
      supplierId: supplierRefs[2], // SafetyFirst Equipment
      stockQuantity: 75,
      reorderLevel: 15,
      unit: "piece",
      active: true,
      createdAt: new Date()
    },
    {
      name: "Cordless Drill 18V",
      sku: "PWR-DRL-18V",
      price: 189.99,
      cost: 135.00,
      description: "Cordless power drill with lithium battery",
      categoryId: categoryRefs[3], // Power Tools
      supplierId: supplierRefs[3], // PowerTool Warehouse
      stockQuantity: 12,
      reorderLevel: 3,
      unit: "piece",
      active: true,
      createdAt: new Date()
    },
    {
      name: "Galvanized Bolts 1/2\"",
      sku: "HW-BLT-0.5",
      price: 12.50,
      cost: 8.75,
      description: "Galvanized steel bolts for heavy-duty construction",
      categoryId: categoryRefs[4], // Hardware
      supplierId: supplierRefs[4], // Hardware Plus
      stockQuantity: 200,
      reorderLevel: 50,
      unit: "box",
      active: true,
      createdAt: new Date()
    },
    {
      name: "Pressure Treated Lumber 2x4x8",
      sku: "LBR-PT-2X4X8",
      price: 8.99,
      cost: 6.25,
      description: "Pressure treated lumber for outdoor construction",
      categoryId: categoryRefs[5], // Lumber & Wood
      supplierId: supplierRefs[5], // Lumber Solutions
      stockQuantity: 300,
      reorderLevel: 25,
      unit: "piece",
      active: true,
      createdAt: new Date()
    },
    {
      name: "Electrical Wire 12 AWG",
      sku: "ELC-WR-12AWG",
      price: 45.99,
      cost: 32.50,
      description: "12 gauge electrical wire for residential wiring",
      categoryId: categoryRefs[6], // Electrical
      supplierId: supplierRefs[6], // ElectricPro Supply
      stockQuantity: 85,
      reorderLevel: 10,
      unit: "roll",
      active: true,
      createdAt: new Date()
    },
    {
      name: "PVC Pipe 4\" x 10ft",
      sku: "PLB-PVC-4X10",
      price: 28.75,
      cost: 20.00,
      description: "4-inch PVC pipe for drainage systems",
      categoryId: categoryRefs[7], // Plumbing
      supplierId: supplierRefs[7], // PlumbMax Distributors
      stockQuantity: 45,
      reorderLevel: 8,
      unit: "piece",
      active: true,
      createdAt: new Date()
    },
    {
      name: "Mini Excavator Rental",
      sku: "HEQ-EXC-MINI",
      price: 350.00,
      cost: 250.00,
      description: "Compact excavator for small construction projects",
      categoryId: categoryRefs[8], // Heavy Equipment
      supplierId: supplierRefs[8], // Heavy Equipment Rentals
      stockQuantity: 3,
      reorderLevel: 1,
      unit: "rental",
      active: true,
      createdAt: new Date()
    },
    {
      name: "Drywall Sheets 4x8",
      sku: "BLD-DRY-4X8",
      price: 15.99,
      cost: 11.50,
      description: "Standard drywall sheets for interior walls",
      categoryId: categoryRefs[9], // Building Materials
      supplierId: supplierRefs[9], // BuildMart Supplies
      stockQuantity: 125,
      reorderLevel: 20,
      unit: "sheet",
      active: true,
      createdAt: new Date()
    }
  ];
  
  for (const product of products) {
    try {
      await addDoc(collection(db, 'products'), product);
      console.log(`✅ Created product: ${product.name}`);
    } catch (error) {
      console.error(`❌ Error creating product ${product.name}:`, error);
    }
  }
}

// Main function to run the population script
async function populateDatabase() {
  try {
    console.log('🚀 Starting database population...');
    
    // Step 1: Create admin user and authenticate
    const adminUser = await createAdminUser();
    
    // Step 2: Populate categories
    const categoryRefs = await populateCategories();
    
    // Step 3: Populate suppliers  
    const supplierRefs = await populateSuppliers();
    
    // Step 4: Populate products (requires category and supplier references)
    await populateProducts(categoryRefs, supplierRefs);
    
    console.log('🎉 Database population completed successfully!');
    console.log('📊 Summary:');
    console.log(`   - Categories: ${categories.length}`);
    console.log(`   - Suppliers: ${suppliers.length}`);
    console.log(`   - Products: 10`);
    console.log(`   - Admin user: admin@admin.com (password: admin123)`);
    
  } catch (error) {
    console.error('💥 Error during database population:', error);
  }
}

// Run the script
populateDatabase();
