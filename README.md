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
- Glucose trend chart
- User-specific reading management

## Technologies Used

**Frontend**
- React.js
- JavaScript
- CSS
- Recharts
- Vite

**Backend**
- Node.js
- Express.js
- PostgreSQL
- JWT
- bcrypt

## Project Structure

```text
sweety-blood-glucose-tracker/
├── frontend/
│   ├── src/
│   ├── package.json
│   └── vite.config.js
├── screenshots/
├── server.js
├── db.js
├── seed.js
├── package.json
├── .env.example
├── .gitignore
└── README.md
```

## Installation and Setup

### 1. Clone the Repository

```bash
git clone https://github.com/deepashreenayak7/sweety-blood-glucose-tracker.git
cd sweety-blood-glucose-tracker
```

### 2. Database Setup

Install PostgreSQL and create a database:

```sql
CREATE DATABASE sweety;
```

Create the required `users` and `readings` tables before running the application. See the database setup instructions in the project.

### 3. Backend Setup

From the repository root:

```bash
npm install
```

Create a `.env` file using `.env.example` as a reference. Add your local PostgreSQL credentials and JWT secret.

Start the backend:

```bash
node server.js
```

Backend URL: `http://localhost:5000`

### 4. Frontend Setup

Open another terminal:

```bash
cd frontend
npm install
npm run dev
```

Open the URL displayed in the terminal, usually `http://localhost:5173`.

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

To create a demo user and sample glucose readings, run this from the repository root:

```bash
node seed.js
```

Demo login:

- Email: `demo@sweety.com`
- Password: `SweetyDemo123!`

The seed script creates sample readings for the demo account.

## API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| POST | `/register` | Register user |
| POST | `/login` | Login user |
| GET | `/protected` | Verify authentication |
| POST | `/readings` | Add reading |
| GET | `/readings` | Get readings |
| PUT | `/readings/:id` | Update reading |
| DELETE | `/readings/:id` | Delete reading |
| GET | `/reports/daily` | Daily report |
| GET | `/reports/month-to-date` | Current month report |
| GET | `/reports/previous-month` | Previous month report |

## Validation

- Glucose values must be whole numbers between 40 and 600 mg/dL.
- Future dates are not allowed.
- Duplicate reading types for the same date are not allowed.
- A maximum of four reading types can be recorded per day.
- Users can access only their own readings.

## Testing

Backend API endpoints and frontend functionality were tested manually.

Registration, login, CRUD operations, validation, reports, and chart display were checked using Postman and the application.

## Screenshots

Screenshots of the working application are included in the `screenshots` folder.

## Notes

**Assumptions**
- Each user has a separate account.
- Each user can record up to four glucose readings per day.
- Application date validation uses India Standard Time.

**Future Improvements**
- Add pagination for glucose readings.
- Add automated frontend and backend tests.
- Improve chart filtering and reporting.
- Add Docker support.

## Author

**Deepashree K Nayak**


