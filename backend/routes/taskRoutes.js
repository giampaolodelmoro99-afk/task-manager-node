const express = require('express');
const router = express.Router();

const { getTasks, createTask, updateTask, deleteTask } = require('../controllers/taskController');
const { taskValidator } = require('../middlewares/validators');
const authenticateToken = require('../middlewares/auth');


router.get('/', authenticateToken, getTasks);

router.post('/', authenticateToken, taskValidator ,createTask);

router.put('/:id', authenticateToken, taskValidator ,updateTask);

router.delete('/:id',authenticateToken, deleteTask );

module.exports = router;