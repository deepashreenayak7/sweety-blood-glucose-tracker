
const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const cors = require('cors');
const pool = require('./db');
require('dotenv').config();

const app = express();

app.use(cors());
app.use(express.json());

// Allowed reading types
const allowedTypes = [
    'Morning fasting',
    'After breakfast',
    'After lunch',
    'After dinner'
];

// Get today's date in India
function getToday() {
    const parts = new Intl.DateTimeFormat('en-CA', {
        timeZone: 'Asia/Kolkata',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
    }).formatToParts(new Date());

    const values = {};
    parts.forEach(part => {
        values[part.type] = part.value;
    });

    return `${values.year}-${values.month}-${values.day}`;
}

// Validate date
function isValidDate(date) {
    if (typeof date !== 'string' ||
        !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
        return false;
    }

    const [year, month, day] = date.split('-').map(Number);
    const dateObject = new Date(Date.UTC(year, month - 1, day));

    return dateObject.getUTCFullYear() === year &&
        dateObject.getUTCMonth() === month - 1 &&
        dateObject.getUTCDate() === day;
}

// HOME
app.get('/', (req, res) => {
    res.send('Sweety Glucose Tracker API is running!');
});

// REGISTER
app.post('/register', async (req, res) => {
    try {
        const { name, email, password } = req.body;

        if (!name || !email || !password) {
            return res.status(400).json({
                message: 'All fields are required'
            });
        }

        if (typeof password !== 'string' || password.length < 6) {
            return res.status(400).json({
                message: 'Password must be at least 6 characters'
            });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const result = await pool.query(
            `INSERT INTO users (name, email, password)
             VALUES ($1, $2, $3)
             RETURNING id, name, email`,
            [name.trim(), email.trim().toLowerCase(), hashedPassword]
        );

        res.status(201).json({
            message: 'Registration successful',
            user: result.rows[0]
        });

    } catch (error) {
        if (error.code === '23505') {
            return res.status(409).json({
                message: 'Email already registered'
            });
        }

        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});

// LOGIN
app.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({
                message: 'Email and password are required'
            });
        }

        const result = await pool.query(
            'SELECT * FROM users WHERE email = $1',
            [email.trim().toLowerCase()]
        );

        if (result.rows.length === 0) {
            return res.status(401).json({
                message: 'Invalid email or password'
            });
        }

        const user = result.rows[0];
        const isMatch = await bcrypt.compare(password, user.password);

        if (!isMatch) {
            return res.status(401).json({
                message: 'Invalid email or password'
            });
        }

        const token = jwt.sign(
            { id: user.id },
            process.env.JWT_SECRET,
            { expiresIn: '1h' }
        );

        res.json({
            message: 'Login successful',
            token,
            user: {
                id: user.id,
                name: user.name,
                email: user.email
            }
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});

// AUTHENTICATION MIDDLEWARE
function authenticateToken(req, res, next) {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({
            message: 'Please login first'
        });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.userId = decoded.id;
        next();

    } catch (error) {
        return res.status(403).json({
            message: 'Invalid or expired token'
        });
    }
}

// TEST AUTHENTICATION
app.get('/protected', authenticateToken, (req, res) => {
    res.json({
        message: 'Authentication successful!',
        userId: req.userId
    });
});

// ADD READING
app.post('/readings', authenticateToken, async (req, res) => {
    try {
        const { reading_date, reading_type, glucose_level } = req.body;

        if (!reading_date || !reading_type || glucose_level === undefined) {
            return res.status(400).json({ message: 'All fields are required' });
        }

        if (!allowedTypes.includes(reading_type)) {
            return res.status(400).json({ message: 'Invalid reading type' });
        }

        if (!Number.isInteger(glucose_level) ||
            glucose_level < 40 || glucose_level > 600) {
            return res.status(400).json({
                message: 'Glucose level must be a whole number between 40 and 600'
            });
        }

        if (!isValidDate(reading_date)) {
            return res.status(400).json({
                message: 'Invalid date. Use YYYY-MM-DD'
            });
        }

        if (reading_date > getToday()) {
            return res.status(400).json({
                message: 'Future dates are not allowed'
            });
        }

        const result = await pool.query(
            `INSERT INTO readings
             (user_id, reading_date, reading_type, glucose_level)
             VALUES ($1, $2, $3, $4)
             RETURNING *`,
            [req.userId, reading_date, reading_type, glucose_level]
        );

        res.status(201).json({
            message: 'Glucose reading added successfully',
            reading: result.rows[0]
        });

    } catch (error) {
        if (error.code === '23505') {
            return res.status(409).json({
                message: 'A reading for this type and date already exists'
            });
        }

        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});

// VIEW ALL READINGS
app.get('/readings', authenticateToken, async (req, res) => {
    try {
        const result = await pool.query(
            `SELECT id, user_id,
                    TO_CHAR(reading_date, 'YYYY-MM-DD') AS reading_date,
                    reading_type, glucose_level, created_at
             FROM readings
             WHERE user_id = $1
             ORDER BY reading_date DESC, id DESC`,
            [req.userId]
        );

        res.json({
            message: 'Readings fetched successfully',
            readings: result.rows
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});

// UPDATE READING
app.put('/readings/:id', authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;
        const { reading_date, reading_type, glucose_level } = req.body;

        if (!/^[1-9]\d*$/.test(id)) {
            return res.status(400).json({ message: 'Invalid reading ID' });
        }

        if (!reading_date || !reading_type || glucose_level === undefined) {
            return res.status(400).json({ message: 'All fields are required' });
        }

        if (!allowedTypes.includes(reading_type)) {
            return res.status(400).json({ message: 'Invalid reading type' });
        }

        if (!Number.isInteger(glucose_level) ||
            glucose_level < 40 || glucose_level > 600) {
            return res.status(400).json({
                message: 'Glucose level must be a whole number between 40 and 600'
            });
        }

        if (!isValidDate(reading_date)) {
            return res.status(400).json({
                message: 'Invalid date. Use YYYY-MM-DD'
            });
        }

        if (reading_date > getToday()) {
            return res.status(400).json({
                message: 'Future dates are not allowed'
            });
        }

        const result = await pool.query(
            `UPDATE readings
             SET reading_date = $1,
                 reading_type = $2,
                 glucose_level = $3
             WHERE id = $4 AND user_id = $5
             RETURNING *`,
            [reading_date, reading_type, glucose_level, id, req.userId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'Reading not found' });
        }

        res.json({
            message: 'Glucose reading updated successfully',
            reading: result.rows[0]
        });

    } catch (error) {
        if (error.code === '23505') {
            return res.status(409).json({
                message: 'A reading for this type and date already exists'
            });
        }

        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});

// DELETE READING
app.delete('/readings/:id', authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;

        if (!/^[1-9]\d*$/.test(id)) {
            return res.status(400).json({ message: 'Invalid reading ID' });
        }

        const result = await pool.query(
            `DELETE FROM readings
             WHERE id = $1 AND user_id = $2
             RETURNING *`,
            [id, req.userId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'Reading not found' });
        }

        res.json({
            message: 'Glucose reading deleted successfully',
            reading: result.rows[0]
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});

// DAILY REPORT
app.get('/reports/daily', authenticateToken, async (req, res) => {
    try {
        const date = req.query.date || getToday();

        if (!isValidDate(date)) {
            return res.status(400).json({
                message: 'Invalid date. Use YYYY-MM-DD'
            });
        }

        const stats = await pool.query(
            `SELECT
                MAX(glucose_level) AS highest,
                MIN(glucose_level) AS lowest,
                ROUND(AVG(glucose_level)::numeric, 1) AS average,
                COUNT(*) AS total_readings
             FROM readings
             WHERE user_id = $1 AND reading_date = $2`,
            [req.userId, date]
        );

        const readings = await pool.query(
            `SELECT id,
                    TO_CHAR(reading_date, 'YYYY-MM-DD') AS reading_date,
                    reading_type, glucose_level
             FROM readings
             WHERE user_id = $1 AND reading_date = $2
             ORDER BY id`,
            [req.userId, date]
        );

        res.json({
            message: 'Daily report fetched successfully',
            date,
            summary: stats.rows[0],
            readings: readings.rows
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});

// MONTH-TO-DATE REPORT
app.get('/reports/month-to-date', authenticateToken, async (req, res) => {
    try {
        const today = getToday();
        const [year, month] = today.split('-');
        const startDate = `${year}-${month}-01`;

        const stats = await pool.query(
            `SELECT
                MAX(glucose_level) AS highest,
                MIN(glucose_level) AS lowest,
                ROUND(AVG(glucose_level)::numeric, 1) AS average,
                COUNT(*) AS total_readings
             FROM readings
             WHERE user_id = $1
             AND reading_date >= $2
             AND reading_date <= $3`,
            [req.userId, startDate, today]
        );

        res.json({
            message: 'Month-to-date report fetched successfully',
            start_date: startDate,
            end_date: today,
            summary: stats.rows[0]
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});

// PREVIOUS MONTH REPORT
app.get('/reports/previous-month', authenticateToken, async (req, res) => {
    try {
        const today = getToday();
        const [year, month] = today.split('-').map(Number);

        const previousMonthDate = new Date(year, month - 2, 1);
        const previousYear = previousMonthDate.getFullYear();
        const previousMonth = String(
            previousMonthDate.getMonth() + 1
        ).padStart(2, '0');

        const startDate = `${previousYear}-${previousMonth}-01`;

        const lastDay = new Date(
            previousYear,
            previousMonthDate.getMonth() + 1,
            0
        ).getDate();

        const endDate = `${previousYear}-${previousMonth}-${String(lastDay).padStart(2, '0')}`;

        const stats = await pool.query(
            `SELECT
                MAX(glucose_level) AS highest,
                MIN(glucose_level) AS lowest,
                ROUND(AVG(glucose_level)::numeric, 1) AS average,
                COUNT(*) AS total_readings
             FROM readings
             WHERE user_id = $1
             AND reading_date >= $2
             AND reading_date <= $3`,
            [req.userId, startDate, endDate]
        );

        res.json({
            message: 'Previous month report fetched successfully',
            start_date: startDate,
            end_date: endDate,
            summary: stats.rows[0]
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});

// START SERVER
app.listen(5000, () => {
    console.log('Server running on port 5000');
});
