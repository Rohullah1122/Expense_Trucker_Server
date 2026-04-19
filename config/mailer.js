import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

console.log("mailer.js START");

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.GMAIL_PASS
    }
});

transporter.verify((error) => {
    if (error) {
        console.log("❌ Mailer Error:", error.message);
    } else {
        console.log("✅ Mailer is ready to send emails");
    }
});

console.log("mailer.js END");

export default transporter;
