# Changelog

All notable changes to this project will be documented in this file.

## [0.1.3] - 2026-04-18
### Fixed
- Today section now actionable with instant checkbox completion and animations.
- Reduced information duplication by filtering today/missed items from lower lists.
- Simplified habit cards to collapsed view with row-click expansion.
- Replaced vague "Upcoming" with specific dates like "Tomorrow" or "Apr 20".
- Faded lower sections to emphasize today-first focus.

## [0.1.2] - 2026-04-18
### Added
- Express + SQLite backend persistence.
- Dashboard summary cards for total habits, active habits, todos due, and completed today.
- Recent activity log under the todo sidebar.
- Improved wide-screen layout and better sidebar spacing.
- Habit progress chart showing recent completion history.

## [0.1.1] - 2026-04-17
### Added
- Recurrence controls for habits and todos.
- Weekly day selection and start/end date range configuration.
- One-time habits and todos with due date support.
- Schedule-aware status labels for recurring tasks.

## [0.1.0] - 2026-04-17
### Added
- Initial habit tracker UI with recurring habits and one-time todos.
- Local persistence via `localStorage`.
- Status labels for habits: upcoming, active, done, missed.
- Browser notification support for habit reminders.
- Test notification button and notification status feedback.
- In-app fallback alert when browser notifications do not appear.
- Local run instructions added to `README.md`.

## [0.0.1] - initial scaffold
### Added
- Basic HTML/CSS/JavaScript scaffold for the tracker.
- Habit and todo sections with add/delete actions.
