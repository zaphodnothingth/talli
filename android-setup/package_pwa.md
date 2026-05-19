# Android Packaging Guide (Bubblewrap)

To publish **Talli** to the Google Play Store, we compile the web build directory (`/dist`) into an **Android App Bundle (.aab)**. 

We use **Bubblewrap CLI**, Google’s official, lightweight node tool designed specifically to wrap Progressive Web Apps in a secure Android wrapper (Trusted Web Activity). This generates a production-signed `.aab` in under 5 minutes without needing a full installation of Android Studio!

---

## Prerequisites

1. **Node.js** (Installed on your system).
2. **Java Development Kit (JDK 17)** and **Android Command Line Tools** (Bubblewrap will **automatically download and configure** these lightweight tools for you on its first run if they are not found!).

---

## Step 1: Install Bubblewrap CLI
Open your Windows PowerShell/Command Prompt and install the Bubblewrap CLI globally:
```powershell
npm install -g @bubblewrap/cli
```

---

## Step 2: Deploy Your PWA (Temporary Host)
Google Play requires that your PWA is hosted on a secure server (`https://`) to verify ownership.
You can host Talli for free on:
- **Netlify** / **Vercel** (Drag and drop the `/dist` folder!)
- **GitHub Pages**
- **Firebase Hosting**

Once hosted, make note of your URL (e.g. `https://talli-score.web.app`).

---

## Step 3: Initialize the Android Project
In your terminal, navigate to the project directory and create the Android workspace:
```powershell
# Navigate to the workspace
cd c:\Users\steve\gits\talli

# Initialize Android build configurations from the manifest
bubblewrap init --manifest=https://talli-score.web.app/manifest.webmanifest
```

Bubblewrap will read your `manifest.webmanifest`, download your app icons, and prompt you with configurations. Press **Enter** to accept the premium defaults:
- **Application ID**: `com.talli.scorekeeper`
- **Application Name**: `Talli Scorekeeper`
- **Theme Color**: `#0B0F19`
- **Short Name**: `Talli`
- **Display Mode**: `standalone`
- **Status Bar Color**: `#0B0F19`

---

## Step 4: Generate a Release Keystore
To sign the app for Google Play, Bubblewrap will ask if you want to generate a new signing keystore.
1. Select **Yes**.
2. Enter a secure password (write it down!).
3. Fill in your name/country code.
This generates a private key file named `android.keystore` in your project folder. Keep this file extremely safe!

> [!TIP]
> Alternatively, you can use our pre-configured script `android-setup/generate_keystore.ps1` to generate a custom-named key file `talli.keystore` prior to initialization.

---

## Step 5: Compile and Build the .AAB Bundle
Compile your Android application:
```powershell
bubblewrap build
```
This downloads lightweight Android compiler libraries, creates a wrapper shell, inserts your `manifest` asset, and compiles a Google Play-compliant **release bundle file**:
- `app-release-signed.aab`

You will find this file in your root folder. This is the official asset you upload to the Google Play Console!

---

## Step 6: Verify Digital Signature Link (Asset Links)
To hide the browser URL bar in the Android application, you must link your website and the app:
1. In the root of your hosted website, create a folder named `.well-known`.
2. Inside `.well-known`, create a file named `assetlinks.json`.
3. Bubblewrap automatically generates the content for this file during the build process, saved as `assetlinks.json` in your project folder. Copy its contents and upload it to your host:
   `https://talli-score.web.app/.well-known/assetlinks.json`

Once uploaded, the Android wrapper will run in complete full-screen app mode, perfectly removing any browser UI borders!
