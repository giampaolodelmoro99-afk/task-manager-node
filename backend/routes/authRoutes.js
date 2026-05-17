const express = require('express');
const router = express.Router();

const {register, login, deleteMe} = require('../controllers/authController');
const {registerValidator, loginValidator} = require('../middlewares/validators');
const authenticateToken = require('../middlewares/auth');

router.post('/register', registerValidator, register);

router.post('/login', loginValidator, login);

router.delete('/delete-me', authenticateToken, deleteMe);

module.exports = router;

