---
description: Step-by-step guide to setting up Google Authentication for Supabase
---

# Setup Google Authentication for Supabase

Follow these steps to enable "Sign in with Google" for your application.

## Phase 1: Get Callback URL from Supabase
1. Go to your **Supabase Dashboard**.
2. Navigate to **Authentication** -> **Providers**.
3. Click on **Google**.
4. Ensure "Enable Sign in with Google" is **ON**.
5. Copy the **Callback URL** (it looks like `https://<your-project>.supabase.co/auth/v1/callback`). You will need this in Phase 3.
6. Keep this tab open.

## Phase 2: Create Google Cloud Project
1. Go to the [Google Cloud Console](https://console.cloud.google.com/).
2. Click the project dropdown at the top left and select **"New Project"**.
3. Name it (e.g., "Cricket Scorer") and click **Create**.
4. Once created, select the project from the notification or dropdown.

## Phase 3: Configure OAuth Consent Screen
1. In the side menu, go to **APIs & Services** -> **OAuth consent screen**.
2. Select **External** for User Type and click **Create**.
3. Fill in the required fields:
   - **App Name**: Cricket Scorer
   - **User Support Email**: Select your email.
   - **Developer Contact Information**: Enter your email.
4. Click **Save and Continue** (you can skip "Scopes" and "Test Users" for now by clicking Save and Continue).
5. On the Summary page, click **Back to Dashboard**.

## Phase 4: Create Credentials
1. In the side menu, click **Credentials**.
2. Click **+ CREATE CREDENTIALS** at the top and select **OAuth client ID**.
3. **Application type**: Select **Web application**.
4. **Name**: Web Client 1 (default is fine).
5. **Authorized redirect URIs**:
   - Click **+ ADD URI**.
   - **PASTE the Callback URL** you copied from Supabase in Phase 1.
6. Click **Create**.

## Phase 5: Connect to Supabase
1. A popup will appear with your **Client ID** and **Client Secret**.
2. Copy the **Client ID**.
3. Go back to your **Supabase Dashboard** tab.
4. Paste it into the **Client ID** field.
5. Copy the **Client Secret** from Google.
6. Paste it into the **Client Secret** field in Supabase.
7. Click **Save** in Supabase.

**Done!** Your "Sign in with Google" button should now work.
