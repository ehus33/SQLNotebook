const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const mysql = require('mysql2');
const app = express();
app.use(express.json());

const PORT = 3000;
const SECRET = 'supersecretkey';  // In production, keep this secret safe

const db = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: 'yourpassword',
  database: 'journal_db'
});

db.query(`
  CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(255) UNIQUE,
    password VARCHAR(255)
  );
`);

db.query(`
  CREATE TABLE IF NOT EXISTS entries (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT,
    content TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  );
`);

const authenticateToken = (req, res, next) => {
  const token = req.headers['authorization'];
  if (!token) return res.sendStatus(403);

  jwt.verify(token.split(' ')[1], SECRET, (err, user) => {
    if (err) return res.sendStatus(403);
    req.user = user;
    next();
  });
};

app.post('/register', async (req, res) => {
  const { username, password } = req.body;
  const hashedPassword = await bcrypt.hash(password, 10);

  db.query('INSERT INTO users (username, password) VALUES (?, ?)', [username, hashedPassword], (err) => {
    if (err) return res.status(400).json({ message: 'User already exists' });
    res.status(201).json({ message: 'User registered' });
  });
});

app.post('/login', (req, res) => {
  const { username, password } = req.body;

  db.query('SELECT * FROM users WHERE username = ?', [username], async (err, results) => {
    if (err || results.length === 0) return res.status(400).json({ message: 'User not found' });

    const user = results[0];
    if (await bcrypt.compare(password, user.password)) {
      const token = jwt.sign({ id: user.id, username: user.username }, SECRET);
      res.json({ token });
    } else {
      res.status(400).json({ message: 'Invalid credentials' });
    }
  });
});

app.post('/entries', authenticateToken, (req, res) => {
  const { content } = req.body;
  const userId = req.user.id;

  db.query('INSERT INTO entries (user_id, content) VALUES (?, ?)', [userId, content], (err) => {
    if (err) return res.status(500).json({ message: 'Error saving entry' });
    res.status(201).json({ message: 'Entry saved' });
  });
});

app.get('/entries', authenticateToken, (req, res) => {
  const userId = req.user.id;

  db.query('SELECT * FROM entries WHERE user_id = ?', [userId], (err, results) => {
    if (err) return res.status(500).json({ message: 'Error fetching entries' });
    res.json(results);
  });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
