# Ghabit Tracker

A minimal web-based habit tracker that supports recurring habits and one-time todo tasks.

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
2. Add a todo like "Visit salon" and optionally select a date.
3. Mark items complete or delete them.

## Notes

- Data is stored locally in your browser using `localStorage`.
- This is a simple first version meant for easy iteration later.
