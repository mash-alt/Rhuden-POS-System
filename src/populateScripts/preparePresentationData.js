// Presentation Data Setup Script
// This script clears all data except users and populates with demo data for presentation

import { initializeApp } from 'firebase/app';
import { 
  getFirestore, 
  collection, 
  getDocs, 
  deleteDoc, 
  doc, 
  addDoc, 
  Timestamp 
} from 'firebase/firestore';
import { 
  getAuth, 
  signInWithEmailAndPassword,
  connectAuthEmulator 
} from 'firebase/auth';
import { config } from 'dotenv';

// Load environment variables
config();

// Firebase configuration
const firebaseConfig = {
  apiKey: process.env.VITE_FIREBASE_API_KEY,
  authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.VITE_FIREBASE_APP_ID
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

// Admin credentials
const ADMIN_EMAIL = 'admin@admin.com';
const ADMIN_PASSWORD = 'admin123';

// Authenticate as admin
const authenticateAdmin = async () => {
  try {
    console.log('🔐 Authenticating as admin...');
    const userCredential = await signInWithEmailAndPassword(auth, ADMIN_EMAIL, ADMIN_PASSWORD);
    console.log('✅ Successfully authenticated as admin:', userCredential.user.email);
    return userCredential.user;
  } catch (error) {
    console.error('❌ Authentication failed:', error);
    throw error;
  }
};

// Helper function to clear a collection
const clearCollection = async (collectionName) => {
  console.log(`🗑️  Clearing ${collectionName} collection...`);
  const querySnapshot = await getDocs(collection(db, collectionName));
  const deletePromises = querySnapshot.docs.map(document => deleteDoc(document.ref));
  await Promise.all(deletePromises);
  console.log(`✅ Cleared ${querySnapshot.docs.length} documents from ${collectionName}`);
};

// Clear all data except users
const clearDatabase = async () => {
  console.log('🧹 Starting database cleanup (preserving users)...\n');
  
  const collectionsToDelete = [
    'products',
    'categories', 
    'suppliers',
    'sales',
    'payments',
    'customers',
    'stockMovements'
  ];

  for (const collectionName of collectionsToDelete) {
    try {
      await clearCollection(collectionName);
    } catch (error) {
      console.error(`❌ Error clearing ${collectionName}:`, error);
    }
  }
  
  console.log('\n✅ Database cleanup complete!\n');
};

// Presentation data
const presentationData = {
  categories: [
    {
      name: "Cement & Concrete",
      description: "Portland cement, ready-mix concrete, and concrete additives",
      active: true
    },
    {
      name: "Steel & Rebar",
      description: "Reinforcement bars, steel beams, and structural steel",
      active: true
    },
    {
      name: "Lumber & Wood",
      description: "Construction lumber, plywood, and wood materials",
      active: true
    },
    {
      name: "Roofing Materials",
      description: "Metal roofing, tiles, and roofing accessories",
      active: true
    },
    {
      name: "Electrical Supplies",
      description: "Wires, conduits, switches, and electrical components",
      active: true
    },
    {
      name: "Plumbing Supplies",
      description: "Pipes, fittings, valves, and plumbing fixtures",
      active: true
    },
    {
      name: "Hardware & Tools",
      description: "Construction tools, fasteners, and hardware",
      active: true
    }
  ],

  suppliers: [
    {
      name: "Manila Steel Corporation",
      contactPerson: "Juan Dela Cruz",
      email: "juan@manilasteel.com",
      phone: "+63 2 8123-4567",
      address: "123 Industrial Ave, Quezon City, Metro Manila",
      active: true
    },
    {
      name: "Cebu Cement Trading",
      contactPerson: "Maria Santos",
      email: "maria@cebucement.com", 
      phone: "+63 32 234-5678",
      address: "456 Commerce St, Cebu City, Cebu",
      active: true
    },
    {
      name: "Davao Lumber Supply",
      contactPerson: "Pedro Rodriguez",
      email: "pedro@davaolumber.com",
      phone: "+63 82 345-6789",
      address: "789 Mahogany Rd, Davao City, Davao del Sur",
      active: true
    },
    {
      name: "Bataan Hardware Corp",
      contactPerson: "Ana Garcia",
      email: "ana@bataanhardware.com",
      phone: "+63 47 456-7890",
      address: "321 Industrial Zone, Mariveles, Bataan",
      active: true
    },
    {
      name: "Iloilo Roofing Solutions",
      contactPerson: "Carlos Mendoza",
      email: "carlos@iloiloroofing.com",
      phone: "+63 33 567-8901",
      address: "654 Business District, Iloilo City, Iloilo",
      active: true
    }
  ],

  customers: [
    {
      name: "ABC Construction Inc.",
      contact: "+63 2 8111-2222",
      email: "projects@abcconstruction.com",
      address: "100 Corporate Center, Makati City",
      creditBalance: 125000.00,
      active: true
    },
    {
      name: "Golden Homes Development",
      contact: "+63 2 8333-4444", 
      email: "procurement@goldenhomes.com",
      address: "200 Real Estate Plaza, Taguig City",
      creditBalance: 75000.00,
      active: true
    },
    {
      name: "Rodriguez Family Residence",
      contact: "+63 917 123-4567",
      email: "jose.rodriguez@email.com", 
      address: "300 Subdivision Ave, Antipolo City",
      creditBalance: 0.00,
      active: true
    },
    {
      name: "Metro Infrastructure Corp",
      contact: "+63 2 8555-6666",
      email: "contracts@metroinfra.com",
      address: "400 Engineering Hub, Pasig City", 
      creditBalance: 250000.00,
      active: true
    },
    {
      name: "Villa Santos Construction",
      contact: "+63 918 765-4321",
      email: "maria.santos@villasantos.com",
      address: "500 Contractor's Row, Quezon City",
      creditBalance: 50000.00,
      active: true
    }
  ]
};

// Generate products with realistic construction materials
const generateProducts = (categories, suppliers) => {
  const products = [];
  
  // Check if we have valid categories and suppliers
  if (!categories || categories.length === 0 || !suppliers || suppliers.length === 0) {
    console.warn('⚠️ No categories or suppliers available for product generation');
    return products;
  }
  
  // Cement & Concrete products
  const cementCategory = categories.find(cat => cat.name === "Cement & Concrete") || categories[0];
  const cebuCement = suppliers.find(sup => sup.name === "Cebu Cement Trading") || suppliers[0];
  
  if (cementCategory && cebuCement) {
    products.push(
      {
        name: "Portland Cement Type I",
        sku: "CEM-001",
        description: "High-quality Portland cement for general construction",
        price: 285.00,
        cost: 250.00,
        stockQuantity: 500,
        unit: "bag",
        reorderLevel: 100,
        categoryId: cementCategory.id,
        supplierId: cebuCement.id,
        active: true
      },
      {
        name: "Ready-Mix Concrete C-20",
        sku: "RMC-020", 
        description: "Ready-mix concrete with 20 MPa compressive strength",
        price: 4500.00,
        cost: 3800.00,
        stockQuantity: 25,
        unit: "cubic meter",
        reorderLevel: 5,
        categoryId: cementCategory.id,
        supplierId: cebuCement.id,
        active: true
      }
    );
  }

  // Steel & Rebar products
  const steelCategory = categories.find(cat => cat.name === "Steel & Rebar") || categories[1] || categories[0];
  const manilSteel = suppliers.find(sup => sup.name === "Manila Steel Corporation") || suppliers[0];
  
  if (steelCategory && manilSteel) {
    products.push(
      {
        name: "Deformed Steel Bar 12mm",
        sku: "RSB-012",
        description: "Grade 40 deformed reinforcement steel bar",
        price: 45.00,
        cost: 38.00,
        stockQuantity: 1000,
        unit: "piece",
        reorderLevel: 200,
        categoryId: steelCategory.id,
        supplierId: manilSteel.id,
        active: true
      },
      {
        name: "Steel I-Beam 6 inches",
        sku: "STL-IB6",
        description: "Standard steel I-beam for structural applications",
        price: 1250.00,
        cost: 1050.00,
        stockQuantity: 50,
        unit: "piece",
        reorderLevel: 10,
        categoryId: steelCategory.id,
        supplierId: manilSteel.id,
        active: true
      }
    );
  }

  // Lumber & Wood products
  const lumberCategory = categories.find(cat => cat.name === "Lumber & Wood") || categories[2] || categories[0];
  const davaoLumber = suppliers.find(sup => sup.name === "Davao Lumber Supply") || suppliers[0];
  
  if (lumberCategory && davaoLumber) {
    products.push(
      {
        name: "Coco Lumber 2x4x10",
        sku: "LBR-2410",
        description: "Coconut lumber 2x4 inches, 10 feet long",
        price: 180.00,
        cost: 150.00,
        stockQuantity: 300,
        unit: "piece",
        reorderLevel: 50,
        categoryId: lumberCategory.id,
        supplierId: davaoLumber.id,
        active: true
      },
      {
        name: "Marine Plywood 4x8 ft",
        sku: "PLY-4X8",
        description: "Waterproof marine grade plywood",
        price: 850.00,
        cost: 720.00,
        stockQuantity: 75,
        unit: "sheet",
        reorderLevel: 15,
        categoryId: lumberCategory.id,
        supplierId: davaoLumber.id,
        active: true
      }
    );
  }

  // Roofing Materials
  const roofingCategory = categories.find(cat => cat.name === "Roofing Materials") || categories[3] || categories[0];
  const iloiloRoofing = suppliers.find(sup => sup.name === "Iloilo Roofing Solutions") || suppliers[0];
  
  if (roofingCategory && iloiloRoofing) {
    products.push(
      {
        name: "Galvanized Iron Sheet 26 Gauge",
        sku: "GI-26G",
        description: "Corrugated galvanized iron roofing sheet",
        price: 450.00,
        cost: 380.00,
        stockQuantity: 200,
        unit: "sheet",
        reorderLevel: 40,
        categoryId: roofingCategory.id,
        supplierId: iloiloRoofing.id,
        active: true
      },
      {
        name: "Clay Roof Tiles",
        sku: "CRT-001",
        description: "Traditional clay roof tiles, weather resistant",
        price: 25.00,
        cost: 20.00,
        stockQuantity: 2000,
        unit: "piece",
        reorderLevel: 500,
        categoryId: roofingCategory.id,
        supplierId: iloiloRoofing.id,
        active: true
      }
    );
  }

  // Hardware & Tools
  const hardwareCategory = categories.find(cat => cat.name === "Hardware & Tools") || categories[6] || categories[0];
  const bataanHardware = suppliers.find(sup => sup.name === "Bataan Hardware Corp") || suppliers[0];
  
  if (hardwareCategory && bataanHardware) {
    products.push(
      {
        name: "Common Wire Nails 3 inches",
        sku: "NL-003",
        description: "Galvanized common wire nails for general construction",
        price: 85.00,
        cost: 70.00,
        stockQuantity: 500,
        unit: "kg",
        reorderLevel: 100,
        categoryId: hardwareCategory.id,
        supplierId: bataanHardware.id,
        active: true
      },
      {
        name: "Heavy Duty Hammer 16oz",
        sku: "HMR-16",
        description: "Professional grade claw hammer with steel handle",
        price: 650.00,
        cost: 520.00,
        stockQuantity: 25,
        unit: "piece",
        reorderLevel: 5,
        categoryId: hardwareCategory.id,
        supplierId: bataanHardware.id,
        active: true
      }
    );
  }

  return products;
};

// Generate realistic sales and payment data
const generateSalesData = (products, customers) => {
  const sales = [];
  const payments = [];
  const now = new Date();
  
  // Generate sales for the last 30 days
  for (let i = 0; i < 30; i++) {
    const saleDate = new Date(now.getTime() - (i * 24 * 60 * 60 * 1000));
    const numSales = Math.floor(Math.random() * 3) + 1; // 1-3 sales per day
    
    for (let j = 0; j < numSales; j++) {
      const customer = customers[Math.floor(Math.random() * customers.length)];
      const numItems = Math.floor(Math.random() * 3) + 1; // 1-3 items per sale
      const items = [];
      let total = 0;
      
      for (let k = 0; k < numItems; k++) {
        const product = products[Math.floor(Math.random() * products.length)];
        const qty = Math.floor(Math.random() * 10) + 1;
        const price = product.price;
        
        items.push({
          productId: product.id,
          qty,
          price
        });
        
        total += qty * price;
      }
      
      const paymentMethods = ['cash', 'gcash', 'credit'];
      const paymentMethod = paymentMethods[Math.floor(Math.random() * paymentMethods.length)];
      
      const sale = {
        items,
        total,
        paymentMethod,
        date: Timestamp.fromDate(saleDate),
        customerId: customer.id,
        paymentIds: []
      };
        // Handle different payment method scenarios
      if (paymentMethod === 'credit') {
        // 70% chance of being paid, 30% chance of pending
        const isPaid = Math.random() > 0.3;
        
        if (isPaid) {
          // For paid credit sales, they're fully paid
          sale.amountPaid = total;
          
          // Create payment record for the credit payment
          const paymentDate = new Date(saleDate.getTime() + (Math.random() * 20 * 24 * 60 * 60 * 1000)); // Paid within 20 days
          const creditPaymentMethods = ['cash', 'gcash', 'transfer', 'check'];
          const creditPaymentMethod = creditPaymentMethods[Math.floor(Math.random() * creditPaymentMethods.length)];
          
          const payment = {
            saleId: null, // Will be set after sale is created
            customerId: customer.id,
            amount: total,
            date: Timestamp.fromDate(paymentDate),
            paymentMethod: creditPaymentMethod
          };
          
          // Add reference numbers for different payment methods
          if (creditPaymentMethod === 'gcash') {
            payment.gcashReferenceNumber = `GC${Date.now().toString().slice(-8)}${Math.floor(Math.random() * 100)}`;
          } else if (creditPaymentMethod === 'transfer') {
            payment.referenceCode = `TRF${Date.now().toString().slice(-6)}${Math.floor(Math.random() * 1000)}`;
          } else if (creditPaymentMethod === 'check') {
            payment.checkNumber = `CHK${Math.floor(Math.random() * 900000) + 100000}`;
          }
          
          // Link this payment to this sale
          sale.paymentIds = [payment];
          payments.push(payment);
        } else {
          // For pending credit sales, partial payment or no payment
          const hasPartialPayment = Math.random() > 0.5;
          if (hasPartialPayment) {
            sale.amountPaid = Math.floor(total * (0.3 + Math.random() * 0.4)); // 30%-70% paid
            
            // Create partial payment record
            const partialPaymentDate = new Date(saleDate.getTime() + (Math.random() * 10 * 24 * 60 * 60 * 1000)); // Paid within 10 days
            const payment = {
              saleId: null,
              customerId: customer.id,
              amount: sale.amountPaid,
              date: Timestamp.fromDate(partialPaymentDate),
              paymentMethod: 'cash'
            };
            
            // Link this payment to this sale
            sale.paymentIds = [payment];
            payments.push(payment);
          } else {
            sale.amountPaid = 0;
            sale.paymentIds = [];
          }
        }
        
        sale.dueDate = Timestamp.fromDate(new Date(saleDate.getTime() + (30 * 24 * 60 * 60 * 1000)));
        
      } else {
        // For cash and GCash sales, create immediate payment
        const payment = {
          saleId: null, // Will be set after sale is created
          customerId: customer.id,
          amount: total,
          date: Timestamp.fromDate(saleDate),
          paymentMethod: paymentMethod
        };
        
        if (paymentMethod === 'gcash') {
          payment.gcashReferenceNumber = `GC${Date.now().toString().slice(-8)}${Math.floor(Math.random() * 100)}`;
        }
        
        // For non-credit sales, amountPaid equals total
        sale.amountPaid = total;
        sale.paymentIds = [payment];
        payments.push(payment);
      }
      
      sales.push(sale);
    }
  }
  
  return { sales, payments };
};

// Add data to Firestore
const addDataToFirestore = async (collectionName, data) => {
  console.log(`📝 Adding ${data.length} documents to ${collectionName}...`);
  const results = [];
  
  for (const item of data) {
    try {
      const docRef = await addDoc(collection(db, collectionName), item);
      results.push({ id: docRef.id, ...item });
    } catch (error) {
      console.error(`❌ Error adding document to ${collectionName}:`, error);
    }
  }
  
  console.log(`✅ Added ${results.length} documents to ${collectionName}`);
  return results;
};

// Main execution function
const preparePresentationData = async () => {
  try {
    console.log('🚀 Starting presentation data preparation...\n');
    
    // Step 0: Authenticate as admin
    await authenticateAdmin();
    
    // Step 1: Clear existing data (except users)
    await clearDatabase();
    
    // Step 2: Add categories
    console.log('📁 Adding categories...');
    const categories = await addDataToFirestore('categories', presentationData.categories);
    
    // Step 3: Add suppliers  
    console.log('🏢 Adding suppliers...');
    const suppliers = await addDataToFirestore('suppliers', presentationData.suppliers);
    
    // Step 4: Add customers
    console.log('👥 Adding customers...');
    const customers = await addDataToFirestore('customers', presentationData.customers);
    
    // Step 5: Generate and add products
    console.log('📦 Generating and adding products...');
    const products = generateProducts(categories, suppliers);
    const addedProducts = await addDataToFirestore('products', products);
    
    // Step 6: Generate and add sales and payments
    console.log('💰 Generating sales and payment data...');
    const { sales, payments } = generateSalesData(addedProducts, customers);
      console.log('🛒 Adding sales...');
    const addedSales = await addDataToFirestore('sales', sales);
    
    // Update payment references with correct sale IDs and add payments
    console.log('💳 Adding payments...');
    const paymentsToAdd = [];
    
    for (let i = 0; i < addedSales.length; i++) {
      const sale = addedSales[i];
      const originalSale = sales[i];
      
      if (originalSale.paymentIds && originalSale.paymentIds.length > 0) {
        for (const payment of originalSale.paymentIds) {
          const paymentWithSaleRef = {
            ...payment,
            saleId: doc(db, 'sales', sale.id) // Firestore document reference
          };
          paymentsToAdd.push(paymentWithSaleRef);
        }
      }
    }
    
    await addDataToFirestore('payments', paymentsToAdd);
    
    // Step 7: Generate some stock movements
    console.log('📊 Adding stock movements...');
    const stockMovements = [];
    for (let i = 0; i < 20; i++) {
      const product = addedProducts[Math.floor(Math.random() * addedProducts.length)];
      const types = ['inbound', 'outbound', 'adjustment'];
      const type = types[Math.floor(Math.random() * types.length)];
      const quantity = Math.floor(Math.random() * 50) + 1;
      
      stockMovements.push({
        productId: product.id,
        type,
        quantity,
        previousStock: product.stockQuantity,
        newStock: type === 'inbound' ? product.stockQuantity + quantity : product.stockQuantity - quantity,
        reason: type === 'inbound' ? 'Purchase order received' : type === 'outbound' ? 'Sale transaction' : 'Inventory audit adjustment',
        date: Timestamp.fromDate(new Date(Date.now() - (Math.random() * 30 * 24 * 60 * 60 * 1000))),
        reference: `REF-${Date.now().toString().slice(-6)}`
      });
    }
    
    await addDataToFirestore('stockMovements', stockMovements);
    
    console.log('\n🎉 Presentation data preparation complete!');
    console.log('\n📊 Summary:');
    console.log(`   • ${categories.length} categories`);
    console.log(`   • ${suppliers.length} suppliers`);
    console.log(`   • ${customers.length} customers`);
    console.log(`   • ${addedProducts.length} products`);    console.log(`   • ${addedSales.length} sales transactions`);
    console.log(`   • ${paymentsToAdd.length} payment records`);
    console.log(`   • ${stockMovements.length} stock movements`);
    console.log('\n✨ Your database is now ready for presentation!');
    
  } catch (error) {
    console.error('❌ Error preparing presentation data:', error);
  }
};

// Run the script
preparePresentationData();
