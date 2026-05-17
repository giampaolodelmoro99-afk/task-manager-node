const jwt = require('jsonwebtoken');
const dotenv = require('dotenv').config();

const secret_key = process.env.SECRET_KEY;

const authenticateToken = (req, res , next) => {

    const token = req.headers['authorization']?.split(` `)[1];

    if(!token) return res.status(401).json({message: 'Accesso negato'});

    jwt.verify(token, secret_key, (err, user) => {

        if(err) return res.status(403).json({message: 'Token non valido'});

        req.user = user;

        next();
    });
};

module.exports = authenticateToken;