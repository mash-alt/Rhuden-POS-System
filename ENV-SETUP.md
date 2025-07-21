# Environment Setup Instructions

## Setting up Firebase Environment Variables

This project uses environment variables for Firebase configuration. Follow these steps to set up your environment:

1. **Copy the template file**: 
   ```bash
   cp .env.example .env
   ```

2. **Edit the `.env` file** with your Firebase project credentials:

   You need to fill in both sets of variables:
   - Regular environment variables (for Node.js scripts)
   - Vite environment variables (for the frontend)

   ```
   # For Node.js scripts (database management scripts)
   FIREBASE_API_KEY=your-api-key
   FIREBASE_AUTH_DOMAIN=your-auth-domain
   FIREBASE_PROJECT_ID=your-project-id
   FIREBASE_STORAGE_BUCKET=your-storage-bucket
   FIREBASE_MESSAGING_SENDER_ID=your-messaging-sender-id
   FIREBASE_APP_ID=your-app-id
   FIREBASE_MEASUREMENT_ID=your-measurement-id

   # For Vite frontend (same values with VITE_ prefix)
   VITE_FIREBASE_API_KEY=your-api-key
   VITE_FIREBASE_AUTH_DOMAIN=your-auth-domain
   VITE_FIREBASE_PROJECT_ID=your-project-id
   VITE_FIREBASE_STORAGE_BUCKET=your-storage-bucket
   VITE_FIREBASE_MESSAGING_SENDER_ID=your-messaging-sender-id
   VITE_FIREBASE_APP_ID=your-app-id
   VITE_FIREBASE_MEASUREMENT_ID=your-measurement-id
   ```

3. **Finding your Firebase credentials**:
   - Go to the [Firebase Console](https://console.firebase.google.com/)
   - Select your project
   - Click the gear icon (⚙️) next to "Project Overview"
   - Select "Project settings"
   - Scroll down to "Your apps" section
   - If you haven't added a web app yet, click the "</>" icon to add one
   - Your Firebase configuration will be displayed

## Running Database Scripts

After setting up your environment variables, you can run database scripts:

- From the project root:
  ```bash
  npm run clear-db       # Clear all documents except user accounts
  npm run clear-db-batch # Clear using batch operations (more efficient)
  npm run populate-db    # Populate with sample data
  ```

- From the populateScripts directory:
  ```bash
  cd src/populateScripts
  npm install
  npm run clear         # Clear all documents except user accounts
  npm run clear-batch   # Clear using batch operations
  npm run populate      # Populate with sample data
  ```

For more detailed information about the database scripts, see `src/populateScripts/README-database-scripts.md`.
