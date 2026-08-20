# Perma App Backend

This is the backend for the Perma App, built using Node.js, Express, and PostgreSQL.

## Features
- User authentication (register, login, email verification, password reset)
- Email notifications using Nodemailer
- Secure token generation with JWT
- Sequelize ORM for database management

## Prerequisites
- Node.js
- PostgreSQL

## Setup
1. Clone the repository.
2. Install dependencies:
   ```bash
   npm install
   ```
3. Configure environment variables in the `.env` file.
4. Start the server:
   ```bash
   npm start
   ```

## Development
To run the server in development mode with live reload:
```bash
npm run dev
```

## API Endpoints
- `POST /api/auth/register` - Register a new user
- `POST /api/auth/login` - Login
- `POST /api/auth/forgot-password` - Request password reset
- `POST /api/auth/reset-password` - Reset password
- `GET /api/auth/verify-email/:token` - Verify email

## License
This project is licensed under the ISC License.
