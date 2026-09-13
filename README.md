# Neon Monsoon: Storm Runner

A fast-paced 3D endless runner set in a cyberpunk Indian city during a mysterious monsoon. Navigate neon-lit streets, dodge obstacles, collect energy, and survive the terrifying Storm Guardian!

## Features
- Full 3D environment built with `three.js`.
- Procedural level generation.
- Responsive swipe controls for mobile devices.
- 8 unique obstacles.
- 6 powerful upgrades (Magnet, Shield, Boost, Dash, Double Score, Flight).
- High score & mission system with local saving.
- Progressive Web App (PWA) ready for offline play on Android.

---

## How to Play (Controls)
- **Mobile:** Swipe Left/Right to change lanes. Swipe Up to jump. Swipe Down to slide.
- **Keyboard (Testing):** Use Arrow Keys or W/A/S/D to move, jump, and slide.

---

## How to Build and Run the Game

This game is built with vanilla JavaScript, HTML, CSS, and Three.js, bundled using Vite.

### Prerequisites
Make sure you have [Node.js](https://nodejs.org/) installed on your machine.

### Local Development
1. Clone or download the repository.
2. Open a terminal in the project root folder.
3. Install dependencies:
   ```bash
   npm install
   ```
4. Start the development server:
   ```bash
   npm run dev
   ```
5. Open the provided `localhost` link in your browser to play the game!

### Production Build
To create a minified production build:
```bash
npm run build
```
The compiled files will be located in the `dist` folder. You can serve this folder using any static web server (like Nginx, Apache, or Vercel/Netlify).

---

## How to Install on Android

### Option A: Install as a Progressive Web App (PWA) - Easiest
Because the game includes a `manifest.json` and a Service Worker, it can be installed directly from a web browser onto an Android phone without needing an app store.

1. **Host the game online:** Upload the contents of your `dist/` folder to a secure (HTTPS) hosting provider like GitHub Pages, Vercel, Netlify, or your own server.
2. **Open the link on your phone:** Open Google Chrome (or another modern browser) on your Android device and navigate to the URL where you hosted the game.
3. **Install:**
   - Chrome will often show a prompt at the bottom of the screen saying "Add Neon Monsoon to Home screen". Tap it.
   - If the prompt doesn't appear, tap the three-dot menu icon in the top right corner of Chrome and select **"Add to Home screen"** or **"Install app"**.
4. **Play:** The game will now appear in your app drawer and on your home screen like a native app. It will run in full-screen mode and works offline!

### Option B: Build a Native Android APK (Using Capacitor)
If you want a true `.apk` or `.aab` file to distribute on the Google Play Store or sideload on devices, you can wrap the web app using Ionic Capacitor.

1. **Install Capacitor CLI:**
   ```bash
   npm install @capacitor/cli @capacitor/core
   npx cap init "Neon Monsoon" "com.neonmonsoon.game" --web-dir dist
   ```
2. **Add Android Platform:**
   ```bash
   npm install @capacitor/android
   npx cap add android
   ```
3. **Build the Web App:**
   ```bash
   npm run build
   ```
4. **Sync Files to Android Project:**
   ```bash
   npx cap sync
   ```
5. **Open in Android Studio:**
   ```bash
   npx cap open android
   ```
6. **Build APK in Android Studio:**
   - Wait for Android Studio to sync the Gradle project.
   - In the top menu, go to **Build > Build Bundle(s) / APK(s) > Build APK(s)**.
   - Once finished, you can locate the generated `.apk` file and transfer it to your Android device to install (ensure "Install from unknown sources" is enabled in your Android settings).
