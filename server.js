const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');
require('dotenv').config();
const API_URL = 'http://localhost:3000';

const app = express();
app.use(cors());
app.use(express.json());

// Pripojenie k tvojej MySQL na freesqldatabase.com
// Hodnoty sa načítajú bezpečne zo skrytých systémových premenných (Environment Variables) na Renderi
const db = mysql.createPool({
  host: process.env.DB_HOST,      
  user: process.env.DB_USER,      
  password: process.env.DB_PASSWORD,  
  database: process.env.DB_NAME,  
  port: 3306,
  waitForConnections: true,
  connectionLimit: 10
});

// Endpoint pre registráciu nového používateľa
app.post('/api/register', (req, res) => {
  const { email, name, password_hash } = req.body;
  const query = 'INSERT INTO users (email, name, password_hash) VALUES (?, ?, ?)';
  
  db.execute(query, [email, name, password_hash], (err, results) => {
    if (err) {
      if (err.code === 'ER_DUP_ENTRY') {
        return res.status(400).json({ error: 'Email už existuje.' });
      }
      return res.status(500).json({ error: err.message });
    }
    res.json({ success: true, user: { email, name, pfp: 'assets/no_pfp.png', sfx: true } });
  });
});

// Endpoint pre prihlásenie
app.post('/api/login', (req, res) => {
  const { email, password_hash } = req.body;
  const query = 'SELECT * FROM users WHERE email = ?';

  db.execute(query, [email], (err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    if (results.length === 0) return res.status(404).json({ error: 'Užívateľ neexistuje.' });

    const user = results[0];
    if (user.password_hash !== password_hash) {
      return res.status(401).json({ error: 'Nesprávne heslo.' });
    }

    res.json({ success: true, user: { email: user.email, name: user.name, pfp: user.pfp, sfx: !!user.sfx } });
  });
});

// Endpoint pre načítanie eventov
app.get('/api/events', (req, res) => {
  db.query('SELECT * FROM events', (err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    
    const eventsObj = {};
    results.forEach(row => {
      const dateStr = new Date(row.event_date).toISOString().split('T')[0];
      eventsObj[dateStr] = {
        tag: row.tag,
        title: row.title,
        desc: row.description,
        ownerEmail: row.owner_email,
        ownerName: row.owner_name,
        ownerPfp: row.owner_pfp,
        viewers: [] 
      };
    });
    res.json(eventsObj);
  });
});

// Endpoint pre pridanie eventu
app.post('/api/events', (req, res) => {
  const { date, tag, title, desc, ownerEmail, ownerName, ownerPfp } = req.body;
  const query = 'REPLACE INTO events (event_date, tag, title, description, owner_email, owner_name, owner_pfp) VALUES (?, ?, ?, ?, ?, ?, ?)';

  db.execute(query, [date, tag, title, desc, ownerEmail, ownerName, ownerPfp], (err) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ success: true });
  });
});

// Endpoint pre zmazanie eventu
app.delete('/api/events/:date', (req, res) => {
  const { date } = req.params;
  db.execute('DELETE FROM events WHERE event_date = ?', [date], (err) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ success: true });
  });
});

// Port, na ktorom pobeží server (Render si ho pridelí sám, lokálne pobeží na 3000)
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server beží na porte ${PORT}`));