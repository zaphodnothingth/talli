# Local Android Packaging Guide using Bubblewrap CLI (Option B)

This guide details how to compile **Talli** locally on your machine into a production-ready **Android App Bundle (`.aab`)** and **APK** using Google's official **Bubblewrap CLI** tool. 

Unlike web-based compilers, Bubblewrap runs entirely on your local command line, giving you complete control over signing keys, configurations, and offline bundle builds.

---

## Prerequisites & Installation

To run Bubblewrap, you need to install the following dependencies on your Windows system:

1. **Node.js**: Ensure Node.js is installed (`node -v`).
2. **Java Development Kit (JDK 17)**: 
   - Download and install **JDK 17** from [Adoptium Temurin](https://adoptium.net/temurin/releases/?version=17) or Oracle.
   - Set your `JAVA_HOME` environment variable to point to your JDK installation path (e.g., `C:\Program Files\Eclipse Adoptium\jdk-17.x.x.x-hotspot\`).
3. **Android SDK Command-line Tools**: 
   - *Tip*: You don't need to install full Android Studio! Bubblewrap can automatically download and install the lightweight Android command-line tools during its first run.

---

## Step 1: Install Bubblewrap CLI

Open **PowerShell** or **Command Prompt** as Administrator and install the Bubblewrap CLI globally:

```powershell
npm install -g @bubblewrap/cli
```

Verify the installation by running:
```powershell
bubblewrap --version
```

---

## Step 2: Initialize the PWA Wrapping Project

Create a dedicated folder for your Android project *outside* your web source repository (e.g. `c:\Users\steve\gits\talli-android`) and navigate into it:

```powershell
mkdir c:\Users\steve\gits\talli-android
cd c:\Users\steve\gits\talli-android
```

Now, initialize your Android project using the live URL of your deployed PWA manifest:

```powershell
bubblewrap init --manifest=https://zaphodnothingth.github.io/talli/manifest.webmanifest
```

### CLI Configuration Wizard Guidance:
During initialization, Bubblewrap will download the manifest, analyze it, and ask you a series of questions. Here are the recommended responses:
1. **JDK Location**: If Bubblewrap doesn't auto-detect it, enter the path to your JDK 17 (e.g., `C:\Program Files\Eclipse Adoptium\jdk-17.x.x-hotspot`).
2. **Android SDK Location**: Hit **Enter** to let Bubblewrap automatically download and install the SDK in a subfolder.
3. **Application Name**: `Talli Scorekeeper`
4. **Short Name**: `Talli`
5. **Package ID**: `com.zaphodnothingth.talli` (This is the unique ID of your app on the Google Play Store).
6. **Host**: `zaphodnothingth.github.io`
7. **Start Path**: `/talli/`
8. **Display Mode**: `standalone` or `fullscreen`
9. **Status Bar Color**: `#08090d` (Matching our premium dark theme background).

---

## Step 3: Configure Code Signing (Keystore)

At the end of the initialization wizard, Bubblewrap will ask if you want to generate a new signing key (keystore):

1. Choose **Yes (generate a new key)**.
2. Fill out the details:
   - **Key store path**: `android.keystore` (default)
   - **Password**: *Create a strong password and write it down securely!* (You will need it every time you build/update the app).
   - **Key alias**: `android` (default)
   - **Common Name (CN)**: Your name (e.g., `Steve`)
   - **Organizational Unit (OU)**: `Development`
   - **Organization (O)**: `Talli`
3. Bubblewrap will generate `android.keystore` and save your configurations to `twa-manifest.json`.

> [!IMPORTANT]
> **BACK UP YOUR KEYSTORE!** Save `android.keystore` in a safe, secure cloud backup or password manager. If you lose this key or forget the password, you will **NEVER** be able to update your Talli app on the Google Play Store.

---

## Step 4: Build the Android App Bundle (`.aab`)

To compile the app into a signed Android App Bundle (`.aab`) ready for Google Play, run:

```powershell
bubblewrap build
```

1. Enter your keystore password when prompted.
2. Bubblewrap will compile the Java wrappers, fetch your web app's live assets, and generate two files in the directory:
   - `app-release-bundle.aab`: The **Google Play Store upload bundle** (includes full optimization).
   - `app-release-signed.apk`: A **standalone installation APK** you can copy and install directly on your phone for testing.

---

## Step 5: Establish Digital Asset Links (Trusted Web Activity)

To prevent your installed Android app from showing a browser URL bar at the top, you must establish a secure cryptographic handshake showing that you own both the domain and the app.

1. Locate the **SHA-256 fingerprint** output by Bubblewrap during the `bubblewrap build` command. 
   - *Note*: If you missed it, you can retrieve it from the key store by running:
     ```powershell
     keytool -list -v -keystore android.keystore -alias android
     ```
2. Create or open the directory `public/.well-known/` inside your main `talli` web repository.
3. Open or create the file `public/.well-known/assetlinks.json`.
4. Populate it with the following JSON content, substituting your package name and SHA-256 fingerprint:

```json
[
  {
    "relation": ["delegate_permission/common.handle_all_urls"],
    "target": {
      "namespace": "android_app",
      "package_name": "com.zaphodnothingth.talli",
      "sha256_cert_fingerprints": [
        "YOUR_SHA256_FINGERPRINT_FROM_BUBBLEWRAP"
      ]
    }
  }
]
```

5. Deploy this file to your live site by running `git add .`, committing, and pushing to `master`.
6. Once deployed, verify it's accessible at `https://zaphodnothingth.github.io/talli/.well-known/assetlinks.json`.

*Result*: When the Android app is installed, Google Play services will fetch this file, verify the match, and immediately hide the URL bar, providing a **100% native, full-screen, premium app experience**!

---

## Summary of Bubblewrap Maintenance Commands

- **Update App Details**: To change details (e.g. name, icons, orientation) later, edit `twa-manifest.json` and run:
  ```powershell
  bubblewrap update
  ```
- **Rebuild App**:
  ```powershell
  bubblewrap build
  ```
