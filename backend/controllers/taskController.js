const {pool} = require('../db');

const getTasks = async (req, res) => {
    try{
        const rows = await pool.query(`SELECT * FROM tasks WHERE user_id = ?`, [req.user.id]);
        res.json(rows);
    }catch(err){
        res.status(500).json({ message: 'Errore server' });
    }
};

const createTask = async (req, res) => {
    const {title_task, date, time} = req.body;

    try{
        await pool.query(`INSERT INTO tasks (user_id, title_task, date, time) VALUES (?, ?, ?, ?)`, [req.user.id, title_task, date, time]);
        res.status(201).json({ message: 'Task creata con successo' });
    }catch(err){
        res.status(500).json({ message: 'Errore server' });
    }
};

const updateTask = async (req, res) => {
    const { title_task, date, time } = req.body;
    const { id } = req.params;

    try {
        const task = await pool.query("SELECT id FROM tasks WHERE id = ? AND user_id = ?", [id, req.user.id]);
        if (task.length === 0) {
            return res.status(404).json({ message: 'Task non trovata o non autorizzato' });
        }
        
        await pool.query(`
            UPDATE tasks
            SET title_task = ?, date = ?, time = ?
            WHERE id = ?
        `, [title_task, date, time, id]);

        res.status(200).json({ message: 'Task aggiornata con successo' });
    } catch (err) {
        res.status(500).json({ message: 'Errore server' });
    }
};

const deleteTask = async (req, res) => {
    const {id} = req.params;

    try{
        const result = await pool.query(`
            DELETE FROM tasks WHERE id = ? AND user_id = ?
            `, [id, req.user.id]);

        if(result.affectedRows === 0) return res.status(404).json({ message: 'Task non trovata o non autorizzato' });

        res.status(200).json({ message: 'Task eliminata con successo' });

    }catch(err){
        res.status(500).json({ message: 'Errore server' });
    }
};

module.exports = {
    getTasks,
    createTask,
    updateTask,
    deleteTask
}