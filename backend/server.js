const express = require('express');
const cors = require('cors');
require('dotenv').config();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator'); 
const { pool, initDb } = require('./db');

const app = express();
app.use(cors());
app.use(express.json());

const secret_key = process.env.SECRET_KEY;

const authenticateToken = (req, res, next) => {
    const token = req.headers['authorization']?.split(' ')[1];
    if (!token) return res.status(401).json({ message: 'Accesso negato' });

    jwt.verify(token, secret_key, (err, user) => {
        if (err) return res.status(403).json({ message: 'Token non valido' });
        req.user = user;
        next();
    });
};

app.post('/register', 
    body('name').isString().trim().isLength({ min: 2, max: 50 }),
    body('surname').isString().trim().isLength({ min: 2, max: 50 }),
    body('email').isEmail().normalizeEmail().isLength({ max: 50 }),
    body('password').isLength({ min: 6 }),
    async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ message: 'Dati non validi', errors: errors.array() });
        }

        const { name, surname, email, password } = req.body;
        const hashedPassword = await bcrypt.hash(password, 10);
        try {
            await pool.query(
                "INSERT INTO users (name, surname, email, password) VALUES (?, ?, ?, ?)", 
                [name, surname, email, hashedPassword]
            );
            res.status(201).json({ message: 'Account creato' });
        } catch (err) {
            if (err.code === 'ER_DUP_ENTRY') return res.status(409).json({ message: 'Email già registrata' });
            res.status(500).json({ message: 'Errore database' });
        }
    }
);

app.post('/login', 
    body('email').isEmail().normalizeEmail(),
    body('password').notEmpty(),
    async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ message: 'Dati non validi', errors: errors.array() });
        }

        const { email, password } = req.body;
        try {
            const rows = await pool.query("SELECT * FROM users WHERE email = ?", [email]);
            if (rows.length === 0) return res.status(401).json({ message: 'Credenziali errate' });

            const match = await bcrypt.compare(password, rows[0].password);
            if (!match) return res.status(401).json({ message: 'Credenziali errate' });

            const token = jwt.sign({ id: rows[0].id, email: rows[0].email }, secret_key, { expiresIn: '1h' });
            res.json({ token });
        } catch (err) {
            res.status(500).json({ message: 'Errore database' });
        }
    }
);

app.delete('/users/me', authenticateToken, async (req, res) => {
    try{
        const result = await pool.query(`DELETE FROM users WHERE id = ?`,[req.user.id]);
        if(result.affectedRows === 0) return res.status(404).json({ message: 'Account non trovato' });
        res.json({message : 'Account eliminato con successo'});
    }catch(err){
        res.status(500).json({ message: 'Errore server' });
    }
});

app.get('/tasks', authenticateToken, async (req, res) => {
    try {
        const rows = await pool.query("SELECT * FROM tasks WHERE user_id = ? ORDER BY date", [req.user.id]);
        res.json(rows);
    } catch (err) {
        res.status(500).json({ message: 'Errore server' });
    }
});

app.post('/tasks', authenticateToken, 
    body('title_task').isString().trim().isLength({ min: 1, max: 50 }),
    body('date').isISO8601(), 
    body('time').matches(/^\d{2}:\d{2}(:\d{2})?$/), 
    async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ message: 'Dati non validi', errors: errors.array() });
        }

        const { title_task, date, time } = req.body;
        try {
            await pool.query(
                "INSERT INTO tasks (user_id, title_task, date, time) VALUES (?, ?, ?, ?)", 
                [req.user.id, title_task, date, time]
            );
            res.status(201).json({ message: 'Task creato' });
        } catch (err) {
            res.status(500).json({ message: 'Errore database' });
        }
    }
);

app.put('/tasks/:id', authenticateToken, 
    body('title_task').isString().trim().isLength({ min: 1, max: 50 }),
    body('date').isISO8601(),
    body('time').matches(/^\d{2}:\d{2}(:\d{2})?$/),
    async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ message: 'Dati non validi', errors: errors.array() });
        }

        const { title_task, date, time } = req.body;
        try {
            const task = await pool.query("SELECT id FROM tasks WHERE id = ? AND user_id = ?", [req.params.id, req.user.id]);
            if (task.length === 0) return res.status(404).json({ message: 'Task non trovato' });

            await pool.query(
                "UPDATE tasks SET title_task = ?, date = ?, time = ? WHERE id = ? AND user_id = ?",
                [title_task, date, time, req.params.id, req.user.id]
            );
            res.json({ message: 'Task aggiornato' });
        } catch (err) {
            res.status(500).json({ message: 'Errore aggiornamento' });
        }
    }
);

app.delete('/tasks/:id', authenticateToken, async (req, res) => {
    try {
        const result = await pool.query("DELETE FROM tasks WHERE id = ? AND user_id = ?", [req.params.id, req.user.id]);
        if (result.affectedRows === 0) return res.status(404).json({ message: 'Task non trovato' });
        res.json({ message: 'Task eliminato' });
    } catch (err) {
        res.status(500).json({ message: 'Errore eliminazione' });
    }
});

app.get('/tasks/:taskId/notes', authenticateToken, async (req, res) => {
    try {
        const rows = await pool.query(`
            SELECT notes.* FROM notes 
            JOIN tasks ON notes.task_id = tasks.id 
            WHERE tasks.id = ? AND tasks.user_id = ?`, 
            [req.params.taskId, req.user.id]
        );
        res.json(rows);
    } catch (err) {
        res.status(500).json({ message: 'Errore server' });
    }
});

app.post('/tasks/:taskId/notes', authenticateToken, 
    body('title_note').isString().trim().isLength({ min: 1, max: 50 }),
    async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ message: 'Dati non validi', errors: errors.array() });
        }

        const { title_note } = req.body;
        try {
            const task = await pool.query("SELECT id FROM tasks WHERE id = ? AND user_id = ?", [req.params.taskId, req.user.id]);
            if (task.length === 0) return res.status(404).json({ message: 'Task non trovato' });

            await pool.query("INSERT INTO notes (task_id, title_note) VALUES (?, ?)", [req.params.taskId, title_note]);
            res.status(201).json({ message: 'Nota creata' });
        } catch (err) {
            res.status(500).json({ message: 'Errore database' });
        }
    }
);

app.put('/notes/:id', authenticateToken, 
    body('title_note').isString().trim().isLength({ min: 1, max: 50 }),
    body('is_completed').isBoolean(), 
    async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ message: 'Dati non validi', errors: errors.array() });
        }

        const { title_note, is_completed } = req.body;
        try {
            const note = await pool.query(
                "SELECT notes.id FROM notes JOIN tasks ON notes.task_id = tasks.id WHERE notes.id = ? AND tasks.user_id = ?",
                [req.params.id, req.user.id]
            );
            if (note.length === 0) return res.status(404).json({ message: 'Nota non trovata' });

            // MODIFICA:is_completed ? 1 : 0 converte il booleano in un intero compatibile con il TINYINT di MariaDB
            await pool.query(`
                UPDATE notes 
                JOIN tasks ON notes.task_id = tasks.id 
                SET notes.title_note = ?,
                notes.is_completed = ? 
                WHERE notes.id = ? AND tasks.user_id = ?`, 
                [title_note, is_completed ? 1 : 0, req.params.id, req.user.id]
            );
            
            res.json({ message: 'Nota aggiornata' });
        } catch (err) {
            res.status(500).json({ message: 'Errore aggiornamento' });
        }
    }
);

app.delete('/notes/:id', authenticateToken, async (req, res) => {
    try {
        const result = await pool.query(`
            DELETE notes FROM notes 
            JOIN tasks ON notes.task_id = tasks.id 
            WHERE notes.id = ? AND tasks.user_id = ?`, 
            [req.params.id, req.user.id]
        );
        if (result.affectedRows === 0) return res.status(404).json({ message: 'Nota non trovata' });
        res.json({ message: 'Nota eliminata' });
    } catch (err) {
        res.status(500).json({ message: 'Errore eliminazione' });
    }
});

initDb().then(() => {
    app.listen(3000, () => console.log("Server running on port 3000"));
});