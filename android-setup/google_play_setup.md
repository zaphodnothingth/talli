# Google Play Console Publishing Checklist (Human Action Steps)

This document is your interactive, step-by-step publishing checklist. Each stage is designed to be completed **one step at a time**. After you complete a step, tell your AI coding agent so they can guide you through the next one!

***

## 📋 Master Publishing Flow

Below is the list of Human Actions required to get **Talli** onto the Google Play Store.

### 🏁 Phase A: Account Setup & Initial App Entry
- [ ] **Step 1**: Register Your Developer Account & Pay the Fee (*Current Action*)
- [ ] **Step 2**: Create a New Application Entry in Play Console
- [ ] **Step 3**: Configure Initial App Options & Policies

### 🎨 Phase B: Graphics & Store Presence
- [ ] **Step 4**: Complete Store Listings Descriptions
- [ ] **Step 5**: Upload Pre-Rendered Branded Graphic Assets

### 🚀 Phase C: Release & Testing (Launch!)
- [ ] **Step 6**: Upload the Signed App Bundle (`.aab`)
- [ ] **Step 7**: Configure Closed Testing Track & Add Testers
- [ ] **Step 8**: Complete 14-Day Testing & Launch to Production

***

## 🔍 Step-by-Step Instructions

### Step 1: Register Your Developer Account (Human Action)
Before you can publish any Android application, Google requires you to register as an official Google Play Developer.
1. **Go to the Portal**: Navigate to the **[Google Play Console Signup Portal](https://play.google.com/console/signup)**.
2. **Select Account Type**:
   - Choose **Personal Account** if you are publishing as an individual (Note: Google requires 20 closed testers for 14 days before launching to production).
   - Choose **Organization Account** if you have a registered business entity (can publish directly without 14-day testing).
3. **Pay Registration Fee**: Complete the profile details and pay the one-time **$25 USD** developer registration fee.
4. **Identity Verification**: Submit a government-issued photo ID (passport or driver's license) to verify your account registration. 
   - *Note*: Verification usually takes between 1 to 48 hours.

> [!TIP]
> **Action Completed?** Once your account is fully verified and you can access the Play Console dashboard, tell the agent:
> *"I have completed Step 1 (Developer Account created). Let's move to Step 2!"*

***

### Step 2: Create a New App Entry (Human Action)
Once you have access to the Console, you need to create a slot for Talli.
1. Open the **[Google Play Console](https://play.google.com/)**.
2. Click **Create App** in the top-right corner.
3. Fill in the app settings:
   - **App Name**: `Talli Scorekeeper`
   - **Default Language**: English (United States)
   - **App or Game**: App
   - **Free or Paid**: Free
4. Confirm declarations and click **Create App** at the bottom.

> [!TIP]
> **Action Completed?** Once you see the empty Talli dashboard in your console, tell the agent:
> *"I have completed Step 2 (App Entry created). What is the next prompt?"*

***

### Step 3: Complete App Declarations (Human Action)
Google requires you to fill out standard declarations regarding your app's content, ads, and target age group.
In the left sidebar of your Talli dashboard, scroll down to **Grow** -> **Store presence** -> **App content**. Complete each questionnaire:
- [ ] **Privacy Policy**: Provide a URL. 
  - *Tip*: You can host a simple text privacy policy on a GitHub Gist or your repository. The Agent can write a privacy policy for you if you ask!
- [ ] **Ads**: Declare **"No, my app does not contain ads."**
- [ ] **App Access**: Choose **"All functionality is available without special access restrictions."**
- [ ] **Content Rating**: Complete the survey. Select **Utility/Utility-Alternative** or **Entertainment** to receive an "All Ages" (3+) rating.
- [ ] **Target Audience**: Select **13 and older** (or Everyone if you have a Privacy Policy).
- [ ] **News Apps**: Declare **"My app is not a news app."**
- [ ] **COVID-19 Apps**: Declare **"My app is not a public COVID-19 contact tracing app."**
- [ ] **Data Safety**: Declare **"No, my app does not collect or share any user data"** (Everything is stored locally on the user's phone!).

> [!TIP]
> **Action Completed?** Once all App Content cards show a green checkmark, tell the agent:
> *"I have completed Step 3 (Declarations complete). Let's do Phase B!"*

***

### Step 4: Write Store Listings (Human Action)
Navigate to **Grow** -> **Store presence** -> **Main store listing** on the left menu.
Fill in your metadata:
- **Short Description**: `The ultimate premium, offline-first scoreboard & tally counter.`
- **Full Description**: Copy and paste the pre-written marketing description from [android-setup/google_play_setup.md](file:///c:/Users/steve/gits/talli/android-setup/google_play_setup.md)!

***

### Step 5: Upload Visual Graphics (Human Action)
Scroll down on the **Main store listing** page to the **Graphics** section:
1. **App Icon**: Upload your premium transparent icon located at:
   📂 **`C:\Users\steve\gits\talli-android\store_icon.png`** (or `public/talli_app_icon_1779224598013.png`)
2. **Feature Graphic**: Upload the premium graphic located at:
   📂 **`c:\Users\steve\gits\talli\public\talli_feature_graphic_1779224611511.png`**
3. **Phone Screenshots**: Take 2 to 4 screenshots of the Talli app running in your browser or installed on your phone, and upload them to the **Phone Screenshots** grid.

> [!TIP]
> **Action Completed?** Once descriptions are filled and graphics are uploaded, click **Save** at the bottom and tell the agent:
> *"I have completed Step 4 & 5 (Store presence is set up). Let's compile and upload the bundle!"*

***

### Step 6: Upload the Signed App Bundle (Human Action)
This is where you upload the package compiled by your agent!
1. Navigate to **Release** -> **Production** (or **Closed testing** if you have a personal account).
2. Click **Create new release**.
3. Under **App bundles**, upload the file located at:
   📂 **`C:\Users\steve\gits\talli-android\app-release-bundle.aab`**
4. Keep the default Release Name (e.g. `1.0.0`) and click **Save as draft**, then **Review release**.

***

### Step 7: Configure Closed Testing (Human Action - Personal Accounts Only)
If you are on a personal developer account, Google requires a 14-day closed test with at least 20 active testers before you can go live:
1. Go to **Release** -> **Testing** -> **Closed testing**.
2. Click **Create track** and name it `Alpha Testing`.
3. Add your testers: Create an email list containing the Google Play Account emails of **20 friends, colleagues, or family members**.
4. Copy the **Join on Android** or **Join on Web** link provided under the "Testers" tab, and share it with your testers!
5. After your 20 testers have kept the app installed for **14 consecutive days**, click **Request Production Access** to launch Talli globally!
