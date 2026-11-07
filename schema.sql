
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(150) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS readings (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    reading_date DATE NOT NULL,
    reading_type VARCHAR(30) NOT NULL,
    glucose_level INTEGER NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT unique_user_reading
        UNIQUE (user_id, reading_date, reading_type),

    CONSTRAINT valid_glucose_level
        CHECK (glucose_level >= 40 AND glucose_level <= 600),

    CONSTRAINT valid_reading_type
        CHECK (reading_type IN (
            'Morning fasting',
            'After breakfast',
            'After lunch',
            'After dinner'
        ))
);
