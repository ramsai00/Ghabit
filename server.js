const express = require('express');
const path = require('path');
const fs = require('fs');
const sqlite3 = require('sqlite3').verbose();

const app = express();
const PORT = process.env.PORT || 3000;
const DATA_DIR = path.join(__dirname, 'data');
const DB_PATH = path.join(DATA_DIR, 'ghabit.db');

if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

const db = new sqlite3.Database(DB_PATH, (error) => {
  if (error) {
    console.error('Unable to open database:', error.message);
    process.exit(1);
  }
});

const initSql = `
CREATE TABLE IF NOT EXISTS habits (
  id TEXT PRIMARY KEY,
  title TEXT,
  time TEXT,
  recurrence TEXT,
  days TEXT,
  intervalDays INTEGER,
  startDate TEXT,
  endDate TEXT,
  completed INTEGER,
  lastCompletedDate TEXT,
  lastFailedDate TEXT,
  createdDate TEXT
);
CREATE TABLE IF NOT EXISTS todos (
  id TEXT PRIMARY KEY,
  title TEXT,
  recurrence TEXT,
  days TEXT,
  intervalDays INTEGER,
  dueDate TEXT,
  startDate TEXT,
  endDate TEXT,
  completed INTEGER,
  lastCompletedDate TEXT
);
`;

db.exec(initSql, (error) => {
  if (error) {
    console.error('Database initialization failed:', error.message);
    process.exit(1);
  }
});

app.use(express.json());
app.use(express.static(path.join(__dirname)));

app.get('/api/data', (req, res) => {
  db.serialize(() => {
    db.all('SELECT * FROM habits', (habitError, habits) => {
      if (habitError) {
        return res.status(500).json({ error: habitError.message });
      }

      db.all('SELECT * FROM todos', (todoError, todos) => {
        if (todoError) {
          return res.status(500).json({ error: todoError.message });
        }

        const normalize = (row) => ({
          ...row,
          days: row.days ? JSON.parse(row.days) : [],
          intervalDays: row.intervalDays || 0,
          completed: Boolean(row.completed),
        });

        res.json({
          habits: habits.map(normalize),
          todos: todos.map(normalize),
        });
      });
    });
  });
});

app.post('/api/sync', (req, res) => {
  const { habits, todos } = req.body || {};

  if (!Array.isArray(habits) || !Array.isArray(todos)) {
    return res.status(400).json({ error: 'habits and todos arrays are required' });
  }

  db.serialize(() => {
    db.run('BEGIN TRANSACTION');
    db.run('DELETE FROM habits');
    db.run('DELETE FROM todos');

    const habitStmt = db.prepare(`
      INSERT INTO habits (
        id, title, time, recurrence, days, intervalDays,
        startDate, endDate, completed, lastCompletedDate,
        lastFailedDate, createdDate
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    habits.forEach((habit) => {
      habitStmt.run(
        habit.id,
        habit.title,
        habit.time || '',
        habit.recurrence || 'daily',
        JSON.stringify(habit.days || []),
        Number(habit.intervalDays) || 0,
        habit.startDate || '',
        habit.endDate || '',
        habit.completed ? 1 : 0,
        habit.lastCompletedDate || '',
        habit.lastFailedDate || '',
        habit.createdDate || ''
      );
    });

    habitStmt.finalize();

    const todoStmt = db.prepare(`
      INSERT INTO todos (
        id, title, recurrence, days, intervalDays,
        dueDate, startDate, endDate, completed, lastCompletedDate
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    todos.forEach((todo) => {
      todoStmt.run(
        todo.id,
        todo.title,
        todo.recurrence || 'one-time',
        JSON.stringify(todo.days || []),
        Number(todo.intervalDays) || 0,
        todo.dueDate || '',
        todo.startDate || '',
        todo.endDate || '',
        todo.completed ? 1 : 0,
        todo.lastCompletedDate || ''
      );
    });

    todoStmt.finalize();

    db.run('COMMIT', (commitError) => {
      if (commitError) {
        return res.status(500).json({ error: commitError.message });
      }
      res.json({ success: true });
    });
  });
});

app.listen(PORT, () => {
  console.log(`Ghabit server running at http://localhost:${PORT}`);
});
