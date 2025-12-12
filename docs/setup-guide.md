# Setup Guide: Getting Your API Keys

To make GroceryCam work, you need 3 main things:
1. **Firebase Project** (for Auth, Database, Storage)
2. **Google Cloud Vision** (for reading receipts)
3. **Gemini API Key** (for strict normalization & recipes)

Follow these steps exactly.

---

## Part 1: Firebase Setup (The Core)

1. Go to the [Firebase Console](https://console.firebase.google.com/) and click **"Add project"**.
2. Name it (e.g., `grocery-cam`) and toggle Google Analytics off (simpler for now).
3. Click **Create Project**.

### Enable Features
Once created, in the left sidebar:

**A. Authentication**
1. Click **Build** > **Authentication**.
2. Click **Get Started**.
3. Select **Google** from the providers list.
4. Enable it, select your support email, and click **Save**.

**B. Firestore Database**
1. Click **Build** > **Firestore Database**.
2. Click **Create Database**.
3. Choose **Production Mode** (or Test Mode if you want to skip security rules for today, but Production is safer).
4. Choose a location (e.g., `nam5 (us-central)`).
5. Click **Enable**.
6. *Important*: If you chose Production Mode, go to the **Rules** tab and change `allow read, write: if false;` to `allow read, write: if request.auth != null;` so logged-in users can save data.

**C. Storage**
1. Click **Build** > **Storage**.
2. Click **Get Started** > **Next** > **Done**.
3. Go to the **Rules** tab and make sure it has `allow read, write: if request.auth != null;`.

### Get Frontend Keys
1. Click the **Gear Icon** (Project Settings) > **General**.
2. Scroll down to **"Your apps"** and click the **Web (</>)** icon.
3. Register app (nickname: `GroceryWeb`).
4. You will see a code block with `firebaseConfig`. **Copy these values**.
5. Open `apps/web/.env.local` on your Desktop and paste them:
   ```env
   NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSy...
   NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=...
   NEXT_PUBLIC_FIREBASE_PROJECT_ID=...
   NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=...
   NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=...
   NEXT_PUBLIC_FIREBASE_APP_ID=...
   ```

---

## Part 2: Backend Service Account

1. Still in **Project Settings**, go to the **Service accounts** tab.
2. Click **Generate new private key**.
3. Click **Generate Key**. This will download a `.json` file.
4. **Rename** this file to `service-account.json`.
5. **Move** this file into the `apps/api/` folder on your Desktop.
6. Verify `apps/api/.env` has:
   ```env
   GOOGLE_APPLICATION_CREDENTIALS=./service-account.json
   ```

---

## Part 3: Google Cloud Vision API

1. Go to the [Google Cloud Console](https://console.cloud.google.com/).
2. In the top bar, make sure your Firebase project is selected (`grocery-cam`).
3. Search for **"Cloud Vision API"** in the top search bar.
4. Click **Enable**.
   *(Note: You may need to link a Billing Account for this, even though it has a free tier).*
5. Open `apps/api/.env` and set:
   ```env
   VISION_PROJECT_ID=your-project-id-from-firebase-settings
   VISION_LOCATION=us-central1
   ```

---

## Part 4: Gemini API Key

1. Go to [Google AI Studio](https://aistudio.google.com/).
2. Click **"Get API key"**.
3. Click **Create API key**.
4. Copy the key starting with `AIza...`.
5. Open `apps/api/.env` and paste it:
   ```env
   GEMINI_API_KEY=your_copied_key_here
   ```

---

## Final Step: Verify
1. Open your terminal in the project folder.
2. Run `npm run seed --workspace=apps/api` (This should work now!).
3. Run `npm run dev`.
