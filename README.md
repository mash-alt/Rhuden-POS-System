# React + TypeScript + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Babel](https://babeljs.io/) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

## Expanding the ESLint configuration

If you are developing a production application, we recommend updating the configuration to enable type-aware lint rules:

```js
export default tseslint.config({
  extends: [
    // Remove ...tseslint.configs.recommended and replace with this
    ...tseslint.configs.recommendedTypeChecked,
    // Alternatively, use this for stricter rules
    ...tseslint.configs.strictTypeChecked,
    // Optionally, add this for stylistic rules
    ...tseslint.configs.stylisticTypeChecked,
  ],
  languageOptions: {
    // other options...
    parserOptions: {
      project: ['./tsconfig.node.json', './tsconfig.app.json'],
      tsconfigRootDir: import.meta.dirname,
    },
  },
})
```

You can also install [eslint-plugin-react-x](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-x) and [eslint-plugin-react-dom](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-dom) for React-specific lint rules:

```js
// eslint.config.js
import reactX from 'eslint-plugin-react-x'
import reactDom from 'eslint-plugin-react-dom'

export default tseslint.config({
  plugins: {
    // Add the react-x and react-dom plugins
    'react-x': reactX,
    'react-dom': reactDom,
  },
  rules: {
    // other rules...
    // Enable its recommended typescript rules
    ...reactX.configs['recommended-typescript'].rules,
    ...reactDom.configs.recommended.rules,
  },
})
```

## Database Management Scripts

The project includes several utility scripts for managing the Firebase Firestore database:

### Setup Environment Variables

1. Copy the `.env.example` file to `.env`:
   ```bash
   cp .env.example .env
   ```

2. Edit the `.env` file with your Firebase project credentials.

   For detailed instructions, see [ENV-SETUP.md](ENV-SETUP.md)

### Available Database Scripts

- **Populate Database**: Add sample data for testing
  ```bash
  npm run populate-db
  ```

- **Prepare Presentation Data**: Set up data for demonstrations
  ```bash
  npm run prepare-presentation
  ```

- **Clear Database**: Remove all documents except user accounts
  ```bash
  npm run clear-db
  ```

- **Clear Database (Batch Version)**: More efficient version for large collections
  ```bash
  npm run clear-db-batch
  ```

- **Clear Database (With Auth)**: Combines login and clearing in one step
  ```bash
  npm run clear-db-auth
  ```

- **Clear Database (Preserve Structure)**: Clears data but keeps collection structure
  ```bash
  npm run clear-db-preserve
  ```

- **Admin Login**: Log in as admin user to get proper permissions
  ```bash
  npm run admin-login
  ```

For more detailed information, see `src/populateScripts/README-database-scripts.md`.
