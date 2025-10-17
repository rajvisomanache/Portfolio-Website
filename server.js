require('dotenv').config();

const express = require('express');
const mysql = require('mysql2');
const bodyParser = require('body-parser');
const cors = require('cors');
const path = require('path');
const nodemailer = require('nodemailer');

const app = express();
const port = 8080;

// Middleware
app.use(cors());
app.use(bodyParser.json());

//Serve frontend files
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

let transporter = nodemailer.createTransport( {
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
// --- End of Nodemailer Setup ---

// API endpoint to save contact data
app.post('/api/contact', (req, res) => {
    const { name, email, message } = req.body;

    if (!name || !email || !message) {
        return res.status(400).json({ message: 'All fields are required.' });
    }

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
                return res.status(500).json({ message: 'Message saved, but failed to send email.' });
            }

            console.log('Email sent:', info.response);
            res.status(200).json({ message: 'Message sent and email delivered successfully!' });
        });
    });
});

app.listen(port, () => {
    console.log(`Server running at http://localhost:8080`);
    console.log(`Frontend served from 'public' folder. Access at http://localhost:8080`);
});

