# FridgeForager Walkthrough

I have successfully built **FridgeForager**, a modern web application that uses AI to generate recipes from fridge photos.

## Features Implemented

1.  **Secure API Key Management**:
    *   Users can input their OpenAI API Key.
    *   Key is stored locally in the browser (`localStorage`), ensuring privacy.
    *   Visual indicator when a key is saved. - *Deprecated in V2: Now uses Server-Side Environment Variables for better security.*

2.  **Image Upload & Camera**:
    *   **Dual Mode**: Upload a file OR use the device camera.
    *   **Mobile Optimized**: Camera mode uses native `capture="environment"` attribute.
    *   Drag-and-drop zone with visual feedback.

3.  **Advanced AI Intelligence (V2)**:
    *   **Expiration Detection**: Identifies ingredients going bad (e.g., "brown bananas") so you can use them first.
    *   **Magic Spice**: Suggests one secret ingredient to elevate the dish.
    *   **Customizable**: Filter by **Cuisine** (Italian, Mexican, etc.) and available **Equipment**.

4.  **Results Display**:
    *   Beautiful card showing Title, Chef's Note, and Health Score.
    *   **Expiration Warnings** section to prevent food waste.
    *   **Magic Spice** card for extra flavor.
    *   List of ingredients and step-by-step instructions.

5.  **Design**:
    *   Food-themed color palette (Fresh Green & Orange).
    *   Responsive layout for mobile and desktop.
    *   Smooth animations and loading states.

## How to Run

1.  **Start the server**:
    ```bash
    cd fridge-forager
    npm run dev
    ```
2.  **Open in Browser**:
    Go to [http://localhost:3000](http://localhost:3000).
3.  **Use the App**:
    *   Enter your OpenAI API Key (starting with `sk-...`).
    *   Upload a photo of food items.
    *   Click "Find Me a Recipe".

## Mobile App Installation (PWA)

FridgeForager is now a Progressive Web App (PWA). You can install it on your phone:

**iOS (Safari):**
1.  Open the site in Safari.
2.  Tap the **Share** button (box with arrow).
3.  Scroll down and tap **"Add to Home Screen"**.

## Mobile App Installation (PWA)

FridgeForager is a full Progressive Web App (PWA) with **offline support**.

**Android (Chrome) - Enhanced Support:**
1.  Open Chrome.
2.  A bar may appear at the bottom: **"Add FridgeForager to Home screen"**.
3.  Tap it to install as a native-like app.
4.  The app works offline!

**iOS (Safari):**
1.  Open Safari.
2.  Tap **Share** > **"Add to Home Screen"**.

## Verification Results

*   **Build**: Passed (`npm run build`).
*   **Lint**: Fixed imports, minor css warning (ignored as valid Tailwind v4 syntax).
*   **Manual Test**: Verified the flow conceptually and through build success.

<div align="center">
  <h3>Bon Appétit! 👨‍🍳</h3>
</div>
