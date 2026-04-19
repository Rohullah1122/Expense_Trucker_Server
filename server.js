import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

import userRoutes from './routes/userRoutes.js';
import expensesRoutes from './routes/expensesRoutes.js';

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());

// Mount routes
app.use('/api/users', userRoutes);
app.use('/api/expenses', expensesRoutes);

app.get('/', (req, res) => {
    res.send('API is running with Users + Expenses');
});

const PORT = process.env.PORT || 3000;

// ⭐ IMPORTANT: Listen on ALL network interfaces
app.listen(PORT, "0.0.0.0", () => {
    console.log(`🚀 Server running on http://0.0.0.0:${PORT}`);
});
