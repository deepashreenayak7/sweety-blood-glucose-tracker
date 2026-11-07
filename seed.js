
const bcrypt = require('bcrypt');
const pool = require('./db');
require('dotenv').config();

async function seedDatabase() {
    try {
        console.log('Starting database seeding...');

        const demoEmail = 'demo@sweety.com';
        const demoPassword = 'SweetyDemo123!';

        // Create or update demo user
        const hashedPassword = await bcrypt.hash(demoPassword, 10);

        const userResult = await pool.query(
            `INSERT INTO users (name, email, password)
             VALUES ($1, $2, $3)
             ON CONFLICT (email)
             DO UPDATE SET
                 name = EXCLUDED.name,
                 password = EXCLUDED.password
             RETURNING id`,
            ['Demo User', demoEmail, hashedPassword]
        );

        const userId = userResult.rows[0].id;

        // Sample glucose readings for the last 7 days
        const readingTypes = [
            'Morning fasting',
            'After breakfast',
            'After lunch',
            'After dinner'
        ];

        const sampleValues = [
            [95, 135, 125, 115],
            [100, 140, 130, 120],
            [98, 138, 128, 118],
            [105, 145, 135, 125],
            [92, 132, 122, 112],
            [102, 142, 132, 122],
            [96, 136, 126, 116]
        ];

        for (let day = 0; day < 7; day++) {
            const date = new Date();
            date.setDate(date.getDate() - day);

            const readingDate = [
                date.getFullYear(),
                String(date.getMonth() + 1).padStart(2, '0'),
                String(date.getDate()).padStart(2, '0')
            ].join('-');

            for (let slot = 0; slot < readingTypes.length; slot++) {
                await pool.query(
                    `INSERT INTO readings
                     (user_id, reading_date, reading_type, glucose_level)
                     VALUES ($1, $2, $3, $4)
                     ON CONFLICT DO NOTHING`,
                    [
                        userId,
                        readingDate,
                        readingTypes[slot],
                        sampleValues[day][slot]
                    ]
                );
            }
        }

        console.log('Seed data added successfully!');
        console.log('Demo Email:', demoEmail);
        console.log('Demo Password:', demoPassword);

    } catch (error) {
        console.error('Error seeding database:', error);
    } finally {
        await pool.end();
    }
}

seedDatabase();
