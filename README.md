# Ghabit Tracker

Version: `0.1.0`

A minimal web-based habit tracker that supports recurring habits and one-time todo tasks.

See `CHANGELOG.md` for version history and recent updates.

## How to use

### Option 1: Open directly
1. Open the project folder `/Users/ramsai001/Ghabit`.
2. Open `index.html` in a browser.

### Option 2: Use a local server (recommended)
1. Open Terminal.
2. Run:
   - `cd /Users/ramsai001/Ghabit`
   - `python3 -m http.server 8000`
3. Open `http://localhost:8000` in your browser.

Then:
1. Add a habit like "Apply ace cream" and set a time.
2. Choose whether the habit should repeat every day, on selected days, or only once.
3. For recurring tasks, set a start date, optional end date, and selected weekdays.
4. Add a todo like "Visit salon" and choose one-time or recurring schedule.
5. Mark items complete or delete them.

## Notes

- Data is stored locally in your browser using `localStorage`.
- This is a simple first version meant for easy iteration later.

## Notification notes

- The app uses browser notifications, so the page must be open in a browser tab.
- Run from `http://localhost:8000` or HTTPS, not `file://`.
- On macOS, also verify browser notifications are allowed in System Settings and that Focus / Do Not Disturb is off.
- Use the "Test notification" button in the app to confirm the browser can show notifications.
