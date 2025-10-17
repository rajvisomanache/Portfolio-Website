require('dotenv').config();

const express = require('express');
const mysql = require('mysql2');
const bodyParser = require('body-parser');
const cors = require('cors');
const path = require('path');
const nodemailer = require('nodemailer');
const axios = require('axios'); // Add this to package.json

const app = express();
const port = 8080;

// Middleware
app.use(cors());
app.use(bodyParser.json());

// Serve frontend files
app.use(express.static(path.join(__dirname, 'public')));

// MySQL connection
const db = mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: process.env.DB_PORT
});

db.connect((err) => {
    if (err) {
        console.error('Database connection failed:', err.stack);
        return;
    }
    console.log('Connected to MySQL database.');
});

// Nodemailer setup
let transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST, 
    port: parseInt(process.env.EMAIL_PORT || "587"), 
    secure: process.env.EMAIL_SECURE === 'true', 
    auth: {
        user: process.env.EMAIL_USER, 
        pass: process.env.EMAIL_PASS, 
    }
});

transporter.verify(function(error, success) {
    if (error) {
        console.error('Nodemailer configuration error:', error);
    } else {
        console.log('Nodemailer is ready to send emails');
    }
});

// --- DISPOSABLE EMAIL CHECK ENDPOINT ---
// This proxies to your Python Flask API on Render
app.post('/api/check-disposable', async (req, res) => {
    const { email } = req.body;

    if (!email) {
        return res.status(400).json({ 
            is_disposable: false, 
            message: 'Email is required' 
        });
    }

    try {
        // Call your Flask API deployed on Render
        const response = await axios.post(
            'https://disposable-e-mail-address-detector.onrender.com/predict',
            { email: email },
            { 
                headers: { 'Content-Type': 'application/json' },
                timeout: 10000 // 10 second timeout
            }
        );

        // Return the result from Flask
        res.json({
            is_disposable: response.data.is_disposable,
            confidence: response.data.confidence
        });

    } catch (error) {
        console.error('Error checking disposable email:', error.message);
        
        // Fallback: Simple domain check if Flask API fails
        const disposableDomains = [
            'tempmail.com', 'mailinator.com', '10minutemail.com',
            'guerrillamail.com', 'yopmail.com', 'trashmail.com',
            'getnada.com', 'maildrop.cc'
        ];
        
        const domain = email.split('@')[1]?.toLowerCase();
        const isDisposable = disposableDomains.includes(domain);
        
        res.json({ 
            is_disposable: isDisposable,
            confidence: 'N/A (fallback)',
            note: 'ML model unavailable, using basic check'
        });
    }
});

// --- CONTACT FORM ENDPOINT ---
app.post('/api/contact', async (req, res) => {
    const { name, email, message } = req.body;

    if (!name || !email || !message) {
        return res.status(400).json({ message: 'All fields are required.' });
    }

    // Optional: Check for disposable email before saving
    // (Your frontend already does this, but you can add server-side validation)

    // Save to DB
    const query = 'INSERT INTO contacts (name, email, message) VALUES (?, ?, ?)';
    db.query(query, [name, email, message], (err, result) => {
        if (err) {
            console.error('Error saving contact:', err);
            return res.status(500).json({ message: 'Failed to save the message.' });
        }

        // Send email after saving to DB
        const mailOptions = {
            from: `"Portfolio Contact" <${process.env.EMAIL_USER}>`,
            to: process.env.NOTIFICATION_EMAIL,
            subject: `New message from ${name}`,
            text: `Name: ${name}\nEmail: ${email}\n\nMessage:\n${message}`,
        };

        transporter.sendMail(mailOptions, (error, info) => {
            if (error) {
                console.error('Error sending email:', error);
                return res.status(500).json({ 
                    message: 'Message saved, but failed to send email notification.' 
                });
            }

            console.log('Email sent:', info.response);
            res.status(200).json({ 
                message: 'Message sent and email delivered successfully!' 
            });
        });
    });
});

app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
    console.log(`Frontend served from 'public' folder. Access at http://localhost:${port}`);
});