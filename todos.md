# Project Improvement Todos

This document outlines recommendations for improving the LabSafety project based on an analysis of its file structure and inferred technologies.

## 1. Codebase Cleanup & Redundancy

*   **Investigate `public/models` vs `public/modelsktx`:**
    *   Determine if `modelsktx` contains optimized versions of models from `models`.
    *   If `modelsktx` is the intended source for optimized models, consider removing the `public/models` directory to avoid duplication and reduce build size.
    *   If `modelsktx` is unused or a remnant, remove it.
*   **Resolve `sopData.json` Duplication:**
    *   The file `sopData.json` exists in both `public/json/sopData.json` and `src/sopData.json`.
    *   Choose one canonical location (e.g., `src/sopData.json` if it's processed by the build, or `public/json/sopData.json` if it's a static asset).
    *   Remove the duplicate file and update all code references to point to the single, correct location.
*   **Review `public/nand.html`:**
    *   Check if `public/nand.html` is still a necessary part of the project.
    *   If it's an old test file or unused page, remove it.
*   **Clean up `unused/` directory:**
    *   The `unused/` directory contains `script.sh`.
    *   Confirm if these files are truly unused.
    *   If confirmed, remove the `unused/` directory and its contents.
*   **Evaluate `move_unused_files.sh`:**
    *   Understand the purpose of `move_unused_files.sh`.
    *   If it's part of the build or deployment process, consider integrating its logic directly into `package.json` scripts or `vite.config.ts` for better automation and clarity.
    *   If it's for manual cleanup, assess its continued relevance.

## 2. Testing & Quality Assurance

*   **Implement Comprehensive Testing:**
    *   No dedicated test directory or test files are immediately visible.
    *   Introduce unit tests for critical functions and modules (e.g., `behaviors`, `entities`, `managers`, `systems`).
    *   Consider integration tests for key user flows or interactions within the 3D environment.
    *   Choose a suitable testing framework (e.g., Jest, Vitest, Playwright for E2E).
*   **Enforce Code Style & Linting:**
    *   Set up and configure a linter (e.g., ESLint) and a code formatter (e.g., Prettier) to ensure consistent code style across the project.
    *   Integrate linting and formatting into pre-commit hooks or CI/CD pipelines.

## 3. Performance & Optimization

*   **Asset Loading Strategy:**
    *   Implement lazy loading for 3D models, textures, and sounds that are not immediately required on scene load.
    *   Consider using a loading manager to provide feedback to the user during asset loading.
*   **Further Asset Optimization:**
    *   Beyond KTX2 (if `modelsktx` is used), explore further compression techniques for images (e.g., WebP), sounds, and 3D models (e.g., Draco compression for GLB).
*   **Bundle Size Analysis:**
    *   Use Vite's built-in bundle analysis tools or a plugin to identify large dependencies or modules contributing significantly to the final bundle size.
    *   Optimize imports and consider dynamic imports where appropriate.

## 4. Documentation

*   **Enhance `README.md`:**
    *   Provide clear setup instructions (dependencies, installation).
    *   Include commands for running the development server, building the project, and running tests.
    *   Add a brief overview of the project's architecture and key modules.
    *   Explain the purpose of different asset folders (e.g., `public/models`, `public/sounds`).
*   **Add Code Comments:**
    *   Add comments for complex logic, non-obvious implementations, or areas that might be difficult for new contributors to understand.
    *   Focus on *why* certain decisions were made, rather than just *what* the code does.

## 5. Security

*   **Review `cert.pem` and `key.pem` usage:**
    *   Ensure these SSL certificates are strictly used for local development and are never exposed or committed to production environments (they are correctly in `.gitignore`, which is good).

## 6. Build Process

*   **Review `vite.config.ts`:**
    *   Ensure the Vite configuration is optimized for both development and production builds (e.g., minification, code splitting, asset handling).
*   **Optimize GitHub Actions (`.github/workflows/deploy.yml`):**
    *   Review the deployment workflow for efficiency, caching strategies, and security best practices.

## 7. Performance Optimizations (New)

*   **Optimize Intersection Checks in Render Loop:**
    *   **Problem:** Frequent `mesh.intersectsMesh()` calls in `scene.onBeforeRenderObservable` for grab and pour targets are computationally expensive.
    *   **Suggestion:** Implement a cheaper distance check (`Vector3.Distance`) before the intersection check to quickly discard objects that are too far apart. Utilize the existing `MAX_POURING_DISTANCE` constant.
*   **Avoid Object Creation/Destruction in Render Loop:**
    *   **Problem:** In `createFireExtinguisher.ts`, a new `RayHelper` is created and destroyed every frame while the extinguisher is active, causing performance issues due to memory churn.
    *   **Suggestion:** Create the `RayHelper` once during initialization and update its `ray` property in the render loop. Use `show()` and `hide()` to manage visibility.
*   **Review Particle System Usage:**
    *   **Problem:** The particle system in `smokeParticles.ts` is configured for up to 150,000 particles, which can impact performance.
    *   **Suggestion:** Profile the particle effects and consider reducing parameters like `emitRate`, `maxLifeTime`, or the total particle count to balance visual quality and performance.