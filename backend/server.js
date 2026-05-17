const express = require('express');
const cors = require('cors');
const { initDb } = require('./db');


const authRoutes = require('./routes/authRoutes');
const tasksRoutes = require('./routes/taskRoutes');
const noteRoutes = require('./routes/noteRoutes');

const app = express();

app.use(cors());
app.use(express.json());


app.use('/auth', authRoutes);
app.use('/tasks', tasksRoutes);
app.use('/notes', noteRoutes);


initDb().then(() => {
    app.listen(3000, () => {
        console.log(`Server running on port 3000`);
    });
});