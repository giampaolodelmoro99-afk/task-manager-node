const { pool } = require('../db');

const getNotes = async (req, res) => {
    const { taskId } = req.params; 

    try {
        const rows = await pool.query(`
            SELECT notes.* FROM notes
            INNER JOIN tasks ON notes.task_id = tasks.id
            WHERE notes.task_id = ? AND tasks.user_id = ?
        `, [taskId, req.user.id]);

        res.json(rows);
    } catch (err) {
        res.status(500).json({ message: 'Errore server' });
    }
};

const createNote = async (req, res) => {
    const {title_note} = req.body;
    const {taskId} = req.params;

    try{
        const task = await pool.query("SELECT id FROM tasks WHERE id = ? AND user_id = ?", [taskId, req.user.id]);
        if (task.length === 0) return res.status(404).json({ message: 'Task non trovato' });

        await pool.query("INSERT INTO notes (task_id, title_note) VALUES (?, ?)", [taskId, title_note]);
        res.status(201).json({ message: 'Nota creata' });
    }catch(err){
        res.status(500).json({ message: 'Errore server' });
    }
};

const updateNote = async (req, res) => {
    const { title_note, is_completed } = req.body;
    const { id } = req.params;

    try {
        const note = await pool.query(
            "SELECT notes.id FROM notes JOIN tasks ON notes.task_id = tasks.id WHERE notes.id = ? AND tasks.user_id = ?",
            [id, req.user.id]
        );
        
        if (note.length === 0) {
            return res.status(404).json({ message: 'Nota non trovata o non autorizzato' });
        }

        await pool.query(`
            UPDATE notes 
            SET title_note = ?,
                is_completed = ? 
            WHERE id = ?`, 
            [title_note, is_completed ? 1 : 0, id]
        );
            
        res.json({ message: 'Nota aggiornata con successo' });
    } catch (err) {
        res.status(500).json({ message: 'Errore server' });
    }
};

const deleteNote = async (req, res) => {
    const { id } = req.params;

    try {
        const result = await pool.query(`
            DELETE notes FROM notes 
            JOIN tasks ON notes.task_id = tasks.id 
            WHERE notes.id = ? AND tasks.user_id = ?
        `, [id, req.user.id]);

        if (result.affectedRows === 0) return res.status(404).json({ message: 'Nota non trovata' });

        res.json({ message: 'Nota eliminata' });
    } catch (err) {
        res.status(500).json({ message: 'Errore server' });
    }
};

module.exports = {
    getNotes,
    createNote,
    updateNote,
    deleteNote
}