const mariadb = require('mariadb');

const dotenv = require('dotenv').config();

const pool = mariadb.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: process.env.DB_PORT,
    connectionLimit: 50
});

async function initDb(){


    try{

        await pool.query(`
            CREATE TABLE IF NOT EXISTS users (
                id INT UNSIGNED NOT NULL PRIMARY KEY AUTO_INCREMENT,
                name VARCHAR(50) NOT NULL,
                surname VARCHAR(50) NOT NULL,
                email VARCHAR(50) NOT NULL UNIQUE,
                password VARCHAR(255) NOT NULL
            )
        `);

        await pool.query(`
            CREATE TABLE IF NOT EXISTS tasks (
                id INT UNSIGNED NOT NULL PRIMARY KEY AUTO_INCREMENT,
                user_id INT UNSIGNED NOT NULL,
                title_task VARCHAR(50) NOT NULL,
                date DATE NOT NULL,
                time TIME , 
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
            )
        `);

        await pool.query(`
            CREATE TABLE IF NOT EXISTS notes (
                id INT UNSIGNED NOT NULL PRIMARY KEY AUTO_INCREMENT,
                task_id INT UNSIGNED NOT NULL,
                title_note VARCHAR(50) NOT NULL,
                is_completed BOOLEAN DEFAULT FALSE,
                FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE
            )
        `);

        console.log('database inizializzato con successo');

    }catch(err){
        console.error('errore inizializzazione database: ', err);
    }
}



module.exports = {pool, initDb};