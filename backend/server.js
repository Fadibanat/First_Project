

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT,
});

const ALLOWED_CATEGORIES = ['Food', 'Transport', 'Bills', 'Entertainment', 'Other'];



const validateId = (req, res, next) => {
    const { id } = req.params;
    if (isNaN(id)) {
        return res.status(400).json({ error: "ID must be a valid number" });
    }
    next();
};


const validateExpenseBody = (req, res, next) => {
    const { title, amount, category, date } = req.body;

    if (!title || amount === undefined || !category || !date) {
        return res.status(400).json({ error: "All fields are required (title, amount, category, date)" });
    }

    if (typeof amount !== 'number' || amount <= 0) {
        return res.status(400).json({ error: "Amount must be a number greater than zero" });
    }

    if (isNaN(Date.parse(date))) {
        return res.status(400).json({ error: "Date must be a valid date format (e.g. YYYY-MM-DD)" });
    }

    if (!ALLOWED_CATEGORIES.includes(category)) {
        return res.status(400).json({ error: `Category must be one of: ${ALLOWED_CATEGORIES.join(', ')}` });
    }

    next();
};




app.get('/api/expenses', async (req, res) => {
    try {
        const queryText = `
            SELECT id, title, amount::float, category, TO_CHAR(date, 'YYYY-MM-DD') AS date
            FROM expenses
            ORDER BY id ASC
        `;
        const result = await pool.query(queryText);
        res.status(200).json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Internal server error" });
    }
});


app.post('/api/expenses', validateExpenseBody, async (req, res) => {
    const { title, amount, category, date } = req.body;

    try {
        const queryText = `
            INSERT INTO expenses (title, amount, category, date)
            VALUES ($1, $2, $3, $4)
            RETURNING id, title, amount::float, category, TO_CHAR(date, 'YYYY-MM-DD') AS date
        `;
        const values = [title, amount, category, date];
        const result = await pool.query(queryText, values);

        res.status(201).json(result.rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Internal server error" });
    }
});


app.get('/api/expenses/:id', validateId, async (req, res) => {
    const { id } = req.params;

    try {
        const queryText = `
            SELECT id, title, amount::float, category, TO_CHAR(date, 'YYYY-MM-DD') AS date
            FROM expenses
            WHERE id = $1
        `;
        const result = await pool.query(queryText, [id]);

        if (result.rows.length === 0) {
            return res.status(404).json({ error: "Expense not found" });
        }

        res.status(200).json(result.rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Internal server error" });
    }
});


app.put('/api/expenses/:id', validateId, validateExpenseBody, async (req, res) => {
    const { id } = req.params;
    const { title, amount, category, date } = req.body;

    try {
        const queryText = `
            UPDATE expenses
            SET title = $1, amount = $2, category = $3, date = $4
            WHERE id = $5
            RETURNING id, title, amount::float, category, TO_CHAR(date, 'YYYY-MM-DD') AS date
        `;
        const values = [title, amount, category, date, id];
        const result = await pool.query(queryText, values);

        if (result.rows.length === 0) {
            return res.status(404).json({ error: "Expense not found" });
        }

        res.status(200).json(result.rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Internal server error" });
    }
});


app.delete('/api/expenses/:id', validateId, async (req, res) => {
    const { id } = req.params;

    try {
        const queryText = "DELETE FROM expenses WHERE id = $1 RETURNING id";
        const result = await pool.query(queryText, [id]);

        if (result.rows.length === 0) {
            return res.status(404).json({ error: "Expense not found" });
        }

        res.status(200).json({ message: "Expense deleted successfully" });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Internal server error" });
    }
});

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});