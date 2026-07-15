const nodemailer = require('nodemailer');
const logger = require('../config/logger');

const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: process.env.SMTP_PORT || 587,
    secure: false,
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
    }
});

const sendEmail = async (to, subject, html) => {
    try {
        const info = await transporter.sendMail({
            from: process.env.EMAIL_FROM || 'noreply@suryainternational.com',
            to,
            subject,
            html
        });
        logger.info('Email sent:', info.messageId);
        return true;
    } catch (error) {
        logger.error('Email error:', error);
        return false;
    }
};

const sendWelcomeEmail = async (user) => {
    const html = `
        <h1>Welcome to Surya International!</h1>
        <p>Hi ${user.firstName || 'User'},</p>
        <p>Your account has been created successfully.</p>
        <p>Email: ${user.email}</p>
        <br>
        <p>Best regards,<br>Surya International Team</p>
    `;
    return sendEmail(user.email, 'Welcome to Surya International', html);
};

const sendPasswordResetEmail = async (user, resetToken) => {
    const resetUrl = `${process.env.CORS_ORIGIN}/reset-password?token=${resetToken}`;
    const html = `
        <h1>Password Reset Request</h1>
        <p>Hi ${user.firstName || 'User'},</p>
        <p>Click the link below to reset your password:</p>
        <a href="${resetUrl}">Reset Password</a>
        <p>This link expires in 1 hour.</p>
        <p>If you didn't request this, please ignore this email.</p>
        <br>
        <p>Best regards,<br>Surya International Team</p>
    `;
    return sendEmail(user.email, 'Password Reset Request', html);
};

module.exports = { sendEmail, sendWelcomeEmail, sendPasswordResetEmail };
