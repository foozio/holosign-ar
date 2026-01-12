# GitHub Secrets & Environment Variables

This document outlines the required secrets and environment variables for the Continuous Integration/Continuous Deployment (CI/CD) of HoloSign AR.

> **Note:** As of the current version, the application is client-side only and does not require runtime secrets for the core application logic.

## 1. CI/CD Pipeline (GitHub Actions)

If a workflow is set up for automated testing or deployment (e.g., to GitHub Pages or Vercel), the following secrets may be required:

| Secret Name | Description | Required For |
| :--- | :--- | :--- |
| `DEPLOY_TOKEN` | Authentication token for the hosting provider (e.g., Vercel, Netlify). | Production Deployment |
| `NPM_TOKEN` | If publishing internal packages or using private registries. | Build Process |

## 2. Application Configuraton (`.env`)

The application uses Vite for build configuration. While currently empty of secrets, strict separation of config is recommended.

| Variable | Description | Default |
| :--- | :--- | :--- |
| `VITE_APP_VERSION` | Application version string. | `0.0.0` |
| `VITE_ENABLE_DEBUG` | Enable debug overlays by default. | `false` |

## 3. Best Practices
*   **Never commit `.env` files** containing real keys.
*   Use `VITE_` prefix only for variables that must be exposed to the client-side bundle.
*   Rotate deployment tokens periodically.
