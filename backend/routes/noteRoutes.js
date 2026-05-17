const express = require('express');
const router = express.Router();

const { getNotes, createNote, updateNote, deleteNote } = require('../controllers/noteController');
const { noteValidator } = require('../middlewares/validators');
const authenticateToken = require('../middlewares/auth');

router.get('/:taskId', authenticateToken, getNotes);

router.post('/:taskId', authenticateToken, noteValidator, createNote);

router.put('/:id', authenticateToken, noteValidator, updateNote);

router.delete('/:id', authenticateToken, deleteNote);

module.exports = router;