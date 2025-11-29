# Cricket Scorer PWA

A modern, mobile-first Progressive Web App (PWA) for tracking cricket matches. Designed for turf cricket and casual matches, it allows you to score games, track stats, and save match history to the cloud.

## Features

-   **Match Scoring**: Track runs, wickets, extras (wides, no-balls), and overs.
-   **Undo Functionality**: Correct mistakes easily with the undo button.
-   **Haptic Feedback**: Tactile vibrations for scoring actions (runs, boundaries, wickets).
-   **Cloud Sync**: Sign in with Google to save your match history to the cloud (Supabase).
-   **Offline Capable**: Works offline as a PWA. Install it on your home screen for a native app-like experience.
-   **Match History**: View past match summaries and stats.
-   **Responsive Design**: Optimized for mobile devices with a sleek, dark-themed UI.

## Tech Stack

-   **Frontend**: React, TypeScript, Vite
-   **Styling**: Tailwind CSS
-   **Backend/Auth**: Supabase
-   **PWA**: vite-plugin-pwa

## Getting Started

1.  **Install Dependencies**:
    ```bash
    npm install
    ```

2.  **Run Locally**:
    ```bash
    npm run dev
    ```

3.  **Build for Production**:
    ```bash
    npm run build
    ```

## Deployment

The app is configured for deployment on Vercel.

1.  Push your code to a GitHub repository.
2.  Import the project into Vercel.
3.  Set up the environment variables (Supabase URL and Anon Key) in the Vercel dashboard.
4.  Deploy!

## Environment Variables

Create a `.env` file in the root directory with the following keys:

```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```
