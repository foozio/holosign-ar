# GitHub Secrets & Configuration

## 1. Environment Variables
Currently, the project does not rely on sensitive environment variables for local development. However, for a production pipeline, the following might be required:

| Secret Name | Description | Required By |
| :--- | :--- | :--- |
| `NPM_TOKEN` | (Optional) If publishing packages to a private registry. | CI/CD |
| `DEPLOY_KEY` | SSH Key or Token for deploying to hosting (e.g., GitHub Pages, Vercel). | CI/CD |

## 2. Client-Side Secrets
**Warning:** Since this is a client-side application, **NO SECRETS** (API Keys, Private Keys) should be bundled in the `src` code.
*   MediaPipe models are loaded from CDN (jsdelivr), requiring no authentication.
*   TensorFlow.js models are served statically.

## 3. Recommendations
*   Ensure `.gitignore` includes `capture_data.json` if it contains personal training data not meant for public repo.
*   Ensure `ml_pipeline/static_model/` (binary model files) is tracked or ignored based on size policies (Git LFS might be needed if models grow large).