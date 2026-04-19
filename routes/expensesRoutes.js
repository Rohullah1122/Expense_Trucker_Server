import express from 'express';
import db from '../config/db.js';

const router = express.Router();

// ADD EXPENSE
router.post('/add', async (req, res) => {
    const { user_id, category_id, amount, description, expense_date } = req.body;

    try {
        const result = await db.query(
            `INSERT INTO expenses (user_id, category_id, amount, description, expense_date)
             VALUES ($1, $2, $3, $4, $5)
             RETURNING *`,
            [user_id, category_id, amount, description, expense_date]
        );

        res.status(201).json({
            message: "Expense added successfully!",
            expense: result.rows[0]
        });

    } catch (err) {
        console.error(err.message);
        res.status(500).json({ error: "Failed to add expense" });
    }
});

// GET EXPENSES BY USER
router.get('/user/:id', async (req, res) => {
    const userId = req.params.id;

    try {
        const result = await db.query(`
            SELECT e.*, c.name AS category_name
            FROM expenses e
            LEFT JOIN categories c ON e.category_id = c.id
            WHERE e.user_id = $1
            ORDER BY e.expense_date DESC
        `, [userId]);

        res.json(result.rows);

    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// GET ALL EXPENSES
router.get('/all', async (req, res) => {
    try {
        const result = await db.query(`
            SELECT e.*, c.name AS category_name
            FROM expenses e
            LEFT JOIN categories c ON e.category_id = c.id
            ORDER BY e.expense_date DESC
        `);

        res.json(result.rows);

    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// UPDATE EXPENSE
router.put('/update/:id', async (req, res) => {
    const expenseId = req.params.id;
    const { category_id, amount, description, expense_date } = req.body;

    try {
        const result = await db.query(
            `UPDATE expenses
             SET category_id = $1, amount = $2, description = $3, expense_date = $4
             WHERE id = $5
             RETURNING *`,
            [category_id, amount, description, expense_date, expenseId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: "Expense not found" });
        }

        res.json({
            message: "Expense updated successfully!",
            expense: result.rows[0]
        });

    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// DELETE EXPENSE
router.delete('/delete/:id', async (req, res) => {
    const expenseId = req.params.id;

    try {
        const result = await db.query(
            `DELETE FROM expenses WHERE id = $1 RETURNING id`,
            [expenseId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: "Expense not found" });
        }

        res.json({ message: "Expense deleted successfully!" });

    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

export default router;
