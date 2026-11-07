# Sweety – Blood Glucose Tracker

A full-stack web application to record, manage, and monitor daily blood glucose readings.

## Features

- User registration and login
- Secure password hashing using bcrypt
- JWT-based authentication
- Add, view, edit, and delete glucose readings
- Four daily reading types:
  - Morning fasting
  - After breakfast
  - After lunch
  - After dinner
- Daily glucose report
- Month-to-date report
- Previous month report
- Highest, lowest, and average glucose values
- Monthly glucose trend chart
- User-specific reading management

## Technologies Used

**Frontend**
- React.js
- JavaScript
- CSS
- Recharts

**Backend**
- Node.js
- Express.js
- PostgreSQL
- JWT
- bcrypt

## Project Structure

```text
backend/
  server.js
  db.js
  package.json
  .env.example
  seed.js
  frontend/
    src/
    package.json
```

## Installation and Setup

### 1. Clone the Repository

```bash
git clone YOUR_GITHUB_REPOSITORY_URL
cd YOUR_REPOSITORY_NAME
```

### 2. Database Setup

Install PostgreSQL and create the database:

```sql
CREATE DATABASE sweety;
```

Create the required tables using the SQL schema provided in the backend project.

### 3. Backend Setup

```bash
cd backend
npm install
```

Create a `.env` file using `.env.example` and enter your local PostgreSQL credentials and JWT secret.

Start the backend:

```bash
node server.js
```

The backend runs on port 5000.

### 4. Frontend Setup

Open another terminal:

```bash
cd backend/frontend
npm install
npm run dev
```

Open the URL displayed in the terminal.

## Environment Variables

The backend requires:

- DB_USER
- DB_HOST
- DB_NAME
- DB_PASSWORD
- DB_PORT
- JWT_SECRET

See `.env.example` for the required format.

Never upload real passwords or secrets to GitHub.

## Seed Data

To create a demo user and sample glucose readings, run:

```bash
cd backend
node seed.js
```

Use the demo credentials configured in the seed script to log in.

## API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| POST | /register | Register user |
| POST | /login | Login user |
| GET | /protected | Verify authentication |
| POST | /readings | Add reading |
| GET | /readings | Get readings |
| PUT | /readings/:id | Update reading |
| DELETE | /readings/:id | Delete reading |
| GET | /reports/daily | Daily report |
| GET | /reports/month-to-date | Current month report |
| GET | /reports/previous-month | Previous month report |

## Validation

- Glucose values must be whole numbers between 40 and 600.
- Future dates are not allowed.
- Duplicate reading types for the same date are not allowed.
- A maximum of four reading types can be recorded per day.
- Users can access only their own readings.

## Running Tests

Backend API endpoints and frontend functionality were tested manually.

For example, registration, login, CRUD operations, validation, and reports were checked using Postman and the application.

## Screenshots

Screenshots of the working application are included in the repository.

## Notes

**Assumptions**
- Each user has a separate account.
- Each user can record up to four glucose readings per day.
- All dates are handled using the application's configured India timezone.

**Future Improvements**
- Add pagination for glucose readings.
- Add automated frontend and backend tests.
- Improve chart filtering and reporting.
- Add Docker support.

## Author

**Deepashree K Nayak**

B.E. Computer Science and Engineering (2025)
