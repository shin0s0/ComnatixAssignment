const express = require('express');
const sqlite3 = require('sqlite3');
const bodyParser = require('body-parser');
const app = express();
const PORT = 3000;


app.use(bodyParser.json());
app.use(express.static('public'));

const db = new sqlite3.Database('./Task.db', (err) => {
  if (err) {
    console.error('Error connecting to the database:', err.message);
  } else {
    console.log('Connected to the SQLite3 database.');
  }
});

db.serialize(() => {
  db.run(`
    CREATE TABLE IF NOT EXISTS tasks (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      description TEXT,
      due_date DATE NOT NULL,
      due_time TIME NOT NULL,
      status TEXT CHECK(status IN ('Pending', 'Completed')) DEFAULT 'Pending',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      completed_at DATETIME
    )
  `);
});

// Get all tasks 
app.get('/tasks', (req, res) => {
  const statusFilter = req.query.status;
  let query = 'SELECT * FROM tasks';
  const params = [];

  if (statusFilter) {
    query += ' WHERE status = ?';
    params.push(statusFilter);
  }

  db.all(query, params, (err, rows) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.json(rows);
  });
});

//Create a new task
app.post('/tasks', (req, res) => {
  const { title, description, due_date, due_time, status } = req.body;

  if (!title || !due_date || !due_time) {
    return res.status(400).json({ error: 'Title, due date, and due time are required' });
  }

  db.run(
    `INSERT INTO tasks (title, description, due_date, due_time, status) VALUES (?, ?, ?, ?, ?)`,
    [title, description, due_date, due_time, status || 'Pending'],
    function (err) {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      res.status(201).json({ id: this.lastID, message: 'Task created successfully' });
    }
  );
});

// Update task
app.put('/tasks/:id', (req, res) => {
  const { id } = req.params;
  const { title, description, due_date, due_time, status } = req.body;

  if (!title || !due_date || !due_time) {
    return res.status(400).json({ error: 'Title, due date, and due time are required' });
  }

  db.run(
    `UPDATE tasks SET title = ?, description = ?, due_date = ?, due_time = ?, status = ? WHERE id = ?`,
    [title, description, due_date, due_time, status, id],
    function (err) {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      if (this.changes === 0) {
        return res.status(404).json({ error: 'Task not found' });
      }
      res.status(200).json({ message: 'Task updated successfully' });
    }
  );
});

// Delete task
app.delete('/tasks/:id', (req, res) => {
  const { id } = req.params;

  db.run(`DELETE FROM tasks WHERE id = ?`, [id], function (err) {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    if (this.changes === 0) {
      return res.status(404).json({ error: 'Task not found' });
    }
    res.status(200).json({ message: 'Task deleted successfully' });
  });
});

// Get a specific task by ID
app.get('/tasks/:id', (req, res) => {
  const { id } = req.params;

  db.get(`SELECT * FROM tasks WHERE id = ?`, [id], (err, row) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    if (!row) {
      return res.status(404).json({ error: 'Task not found' });
    }
    res.json(row);
  });
});

// Toggle task status
app.patch('/tasks/:id/status', (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  if (!['Pending', 'Completed'].includes(status)) {
    return res.status(400).json({ error: 'Invalid status value' });
  }

  const completed_at = status === 'Completed' ? new Date().toISOString() : null;

  db.run(
    `UPDATE tasks SET status = ?, completed_at = ? WHERE id = ?`,
    [status, completed_at, id],
    function (err) {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      if (this.changes === 0) {
        return res.status(404).json({ error: 'Task not found' });
      }
      res.status(200).json({ message: 'Task status updated successfully' });
    }
  );
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
