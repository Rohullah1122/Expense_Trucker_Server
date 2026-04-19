import express from 'express';
import bcrypt from 'bcrypt';
import db from '../config/db.js'; 
import crypto from 'crypto';


console.log("Before mailer import");
import transporter from '../config/mailer.js';
console.log("After mailer import");


const router = express.Router();

console.log("Loaded userRoutes from:", import.meta.url);


console.log("userRoutes START");


router.get('/test', (req, res) => {
    res.send("User route working");
});

// REGISTER
router.post('/register', async (req, res) => {
    const { username, email, password } = req.body;

    try {
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const result = await db.query(
            'INSERT INTO users (username, email, password_hash) VALUES ($1, $2, $3) RETURNING id, username, email',
            [username, email, hashedPassword]
        );

        res.status(201).json({
            message: "User registered successfully!",
            user: result.rows[0]
        });
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ error: "User already exists or database error" });
    }
});

// GET USERS
router.get('/getuser', async (req, res) => {
    try {
        const result = await db.query('SELECT id, username, email FROM users');
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// LOGIN
router.post('/login', async (req, res) => {
    const { email, password } = req.body;

    try {
        const result = await db.query('SELECT * FROM users WHERE email = $1', [email]);
        
        if (result.rows.length === 0) {
            return res.status(401).json({ error: "Invalid email or password" });
        }

        const user = result.rows[0];
        const isMatch = await bcrypt.compare(password, user.password_hash);

        if (!isMatch) {
            return res.status(401).json({ error: "Invalid email or password" });
        }

        res.json({
            message: "Login successful!",
            user: {
                id: user.id,
                username: user.username,
                email: user.email
            }
        });

    } catch (err) {
        console.error(err.message);
        res.status(500).json({ error: "Server error during login" });
    }
});

// FORGOT PASSWORD
router.post('/forgot-password', async (req, res) => {
    const { email } = req.body;
    try {
        const token = crypto.randomBytes(20).toString('hex');
        const expires = new Date(Date.now() + 3600000);

        const result = await db.query(
            'UPDATE users SET reset_token = $1, reset_token_expires = $2 WHERE email = $3 RETURNING username',
            [token, expires, email]
        );

        if (result.rows.length === 0) return res.status(404).json({ error: "Email not found" });

        const username = result.rows[0].username;
        const resetLink = `http://localhost:3000/reset-password.html?token=${token}`;

        const mailOptions = {
            from: `"Expense Trucker" <${process.env.EMAIL_USER}>`,
            to: email,
            subject: 'Expense Trucker - Password Reset',
            html: `
                <h3>Hello ${username},</h3>
                <p>You requested a password reset.</p>
                <a href="${resetLink}">Reset My Password</a>
            `
        };

        await transporter.sendMail(mailOptions);
        res.json({ message: "Check your email! A reset link has been sent." });

    } catch (err) {
        console.error("Mailer Error:", err);
        res.status(500).json({ error: "Failed to send email." });
    }
});

// RESET PASSWORD
router.post('/reset-password', async (req, res) => {
    const { token, newPassword } = req.body;

    try {
        const user = await db.query(
            'SELECT id FROM users WHERE reset_token = $1 AND reset_token_expires > NOW()',
            [token]
        );

        if (user.rows.length === 0) {
            return res.status(400).json({ error: "Link is invalid or expired." });
        }

        const salt = await bcrypt.genSalt(10);
        const hashedNewPassword = await bcrypt.hash(newPassword, salt);

        await db.query(
            'UPDATE users SET password_hash = $1, reset_token = NULL, reset_token_expires = NULL WHERE id = $2',
            [hashedNewPassword, user.rows[0].id]
        );

        res.json({ message: "Password reset successful!" });
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ error: "Server error during password reset." });
    }
});


console.log("userRoutes END");

export default router;
