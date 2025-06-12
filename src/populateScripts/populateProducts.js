/* firestore rules:
    rules_version = '2';

service cloud.firestore {
  match /databases/{database}/documents {
    // Users collection - allow users to create and read their own documents
    match /users/{userId} {
      // Allow user to create their own document during registration
      allow create: if request.auth != null && request.auth.uid == userId;
      
      // Allow user to read/update their own document
      allow read, update: if request.auth != null && request.auth.uid == userId;
      
      // Allow admins to read all user documents
      allow read: if request.auth != null && 
                     exists(/databases/$(database)/documents/users/$(request.auth.uid)) &&
                     get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
    }
    
    // Products collection - authenticated users can read, admins can write
    match /products/{productId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && 
                      exists(/databases/$(database)/documents/users/$(request.auth.uid)) &&
                      get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
    }
    
    // Categories collection - authenticated users can read, admins can write
    match /categories/{categoryId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && 
                      exists(/databases/$(database)/documents/users/$(request.auth.uid)) &&
                      get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
    }
    
    // Suppliers collection - authenticated users can read, admins can write
    match /suppliers/{supplierId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && 
                      exists(/databases/$(database)/documents/users/$(request.auth.uid)) &&
                      get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
    }
    
    // Inventory collection - authenticated users can read, staff+ can write
    match /inventory/{inventoryId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && 
                      exists(/databases/$(database)/documents/users/$(request.auth.uid));
    }
    
    // Sales collection - authenticated users can read/write
    match /sales/{saleId} {
      allow read, write: if request.auth != null;
    }
    
    // Payments collection - authenticated users can read/write
    match /payments/{paymentId} {
      allow read, write: if request.auth != null;
    }
    
    // Customers collection - authenticated users can read/write
    match /customers/{customerId} {
      allow read, write: if request.auth != null;
    }
  }
}
*/