# Ghabit Tracker

Version: `0.1.0`

A minimal web-based habit tracker that supports recurring habits and one-time todo tasks.

See `CHANGELOG.md` for version history and recent updates.

## How to use

### Option 1: Start the backend server
1. Open Terminal.
2. Run:
   - `cd /Users/ramsai001/Ghabit`
   - `npm install`
   - `npm start`
3. Open `http://localhost:3000` in your browser.

### Option 2: Open directly
1. Open the project folder `/Users/ramsai001/Ghabit`.
2. Open `index.html` in a browser.

Then:
1. Add a habit like "Apply ace cream" and set a time.
2. Choose whether the habit should repeat every day, every X days, on weekends only, on selected days, or only once.
3. For recurring tasks, set a start date, optional end date, and selected weekdays when needed.
4. Add a todo like "Visit salon" and choose one-time or recurring schedule with interval and weekend rules.
5. Use the calendar panel to see the next 14 days of scheduled habits and tasks.
6. Mark items complete or delete them.

## Build for Android
1. Make sure you have Android Studio installed and Android SDK configured.
2. Open Terminal and run:
   - `cd /Users/ramsai001/Ghabit`
   - `npm install`
   - `npm run android`
3. This will copy the web app into `www/`, sync Capacitor, and open the Android project.
4. In Android Studio, run the app on an emulator or connected device.

> The Android app uses local app storage by default, so it works offline. If you want backend sync, run `npm start` and use a hosted backend URL.

## Notes

- When you run the app with `npm start`, it uses the Express backend and persists data in SQLite.
- Backend data is stored in `data/ghabit.db`.
- If the backend is unavailable, the app will fall back to browser `localStorage` for local-only storage.

## Prevent accidental push to main

This repository includes a local Git hook at `.githooks/pre-push` that rejects direct pushes to `main` or `master`.

To enable it locally:

```bash
git config core.hooksPath .githooks
chmod +x .githooks/pre-push
```

After enabling it, attempting to push directly to `main` will fail with an error in the terminal.

If you also use GitHub, enable branch protection on `main` to block direct pushes on the remote side.

## Notification notes

- The app uses browser notifications, so the page must be open in a browser tab.
- Run from `http://localhost:3000` or HTTPS, not `file://`.
- On macOS, also verify browser notifications are allowed in System Settings and that Focus / Do Not Disturb is off.
- Use the "Test notification" button in the app to confirm the browser can show notifications.
