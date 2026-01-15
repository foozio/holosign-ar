# Security Evaluation

## 1. Client-Side Security
*   **XSS (Cross-Site Scripting):**
    *   **Risk:** Low. The application creates UI elements using `document.createElement` and `innerText`, which naturally sanitizes input.
    *   **Note:** Avoid using `.innerHTML` with unsanitized data (currently used in `updateDebug` but input comes from internal `debugInfo`).
*   **DOM Manipulation:**
    *   Direct DOM manipulation in `App.ts` is error-prone. Ensure event listeners are properly cleaned up to avoid memory leaks.

## 2. Data Privacy
*   **Camera Access:**
    *   The app requests camera permissions. It is crucial to inform the user (via Privacy Policy) that video data is processed **locally** and not sent to any server.
*   **Dataset Export:**
    *   Captured JSON files contain detailed biometric data (hand landmarks). Users should be aware of what they are downloading/sharing.

## 3. Dependency Analysis
*   **Vulnerabilities:**
    *   Dependencies (`three`, `vite`, `tensorflow/tfjs`) should be regularly scanned (`npm audit`).
    *   `@mediapipe/hands` loads resources from a CDN. Ensure Content Security Policy (CSP) allows this but restricts other external sources.

## 4. Machine Learning Security
*   **Adversarial Inputs:**
    *   Rule-based classifiers are susceptible to "gaming" (finding weird hand poses that trigger false positives). This is an efficacy issue rather than a security threat in this context.
    *   Model poisoning: If training data is sourced from public contributions, ensure validation to prevent malicious samples from degrading the model.

## 5. Input Validation
*   **JSON Import:**
    *   If an "Import Dataset" feature is added, strict validation of the JSON structure is required to prevent crashing the app or logic injection.