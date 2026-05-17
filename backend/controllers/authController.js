const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const dotenv = require('dotenv').config();
const { pool } = require('../db');

const secret_key = process.env.SECRET_KEY;

const register = async (req, res) => {
    const { name, surname, email, password } = req.body;

    try {
        const hashedPassword = await bcrypt.hash(password, 10);

        await pool.query(`
            INSERT INTO users (name, surname, email, password) VALUES (?, ?, ?, ?)
        `, [name, surname, email, hashedPassword]);

        res.status(201).json({ message: 'Account creato' });
    } catch (err) {
        if (err.code === 'ER_DUP_ENTRY') {
            return res.status(409).json({ message: 'Email già registrata' });
        }
        res.status(500).json({ message: 'Errore database' });
    }
};

const login = async (req, res) => {
    const { email, password } = req.body;

    try {
        const rows = await pool.query(`
            SELECT * FROM users WHERE email = ?
        `, [email]);

        if (rows.length === 0) return res.status(401).json({ message: 'Credenziali errate' });

        const match = await bcrypt.compare(password, rows[0].password);
        if (!match) return res.status(401).json({ message: 'Credenziali errate' });

        const token = jwt.sign(
            { id: rows[0].id, email: rows[0].email },
            secret_key,
            { expiresIn: '1h' }
        );

        res.json({ token });
    } catch (err) {
        res.status(500).json({ message: 'Errore database' });
    }
};

const deleteMe = async (req, res) => {
    try {
        const result = await pool.query(`
            DELETE FROM users WHERE id = ?
        `, [req.user.id]);

        if (result.affectedRows === 0) return res.status(404).json({ message: 'Account non trovato' });

        res.json({ message: 'Account eliminato con successo' });
    } catch (err) {
        res.status(500).json({ message: 'Errore server' });
    }
};

module.exports = {
    register,
    login,
    deleteMe
};