# Music LMS Backend API

A comprehensive backend API for a Music Learning Management System built with Express.js, TypeScript, MongoDB, and Firebase.

## Features

- **User Management**: Registration, authentication, and role-based access control
- **Course Management**: Create and manage music courses
- **Video Streaming**: Handle video uploads and streaming
- **Assignment System**: Create assignments and track submissions
- **Progress Tracking**: Monitor student progress and analytics
- **Subscription Management**: Handle free trials and premium subscriptions
- **Payment Integration**: Ready for Stripe integration (Phase 6)

## Tech Stack

- **Runtime**: Node.js with Express.js
- **Language**: TypeScript
- **Database**: MongoDB Atlas
- **Authentication**: Firebase Auth + JWT
- **File Storage**: Firebase Storage
- **Security**: Helmet, CORS, Rate Limiting

## Project Structure

```
backend/
├── src/
│   ├── config/          # Configuration files
│   ├── controllers/     # Route controllers
│   ├── middleware/      # Custom middleware
│   ├── models/          # MongoDB models
│   ├── routes/          # API routes
│   ├── services/        # Business logic
│   ├── types/           # TypeScript types
│   └── utils/           # Utility functions
├── config/              # Environment configuration
└── tests/               # Test files
```

## Getting Started

### Prerequisites

- Node.js (v18 or higher)
- MongoDB Atlas account
- Firebase project

### Installation

1. Install dependencies:
```bash
npm install
```

2. Create environment file:
```bash
cp config/env.example .env
```

3. Configure environment variables in `.env`:
   - Set your MongoDB Atlas connection string
   - Configure Firebase credentials
   - Set JWT secrets
   - Configure other settings

### Development

Start the development server:
```bash
npm run dev
```

The server will start on `http://localhost:5000`

### Production

Build the project:
```bash
npm run build
```

Start the production server:
```bash
npm start
```

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - User login
- `GET /api/auth/me` - Get current user profile
- `POST /api/auth/logout` - User logout

### Health Check
- `GET /api/health` - API health status

## Environment Variables

See `config/env.example` for all required environment variables.

## Security Features

- JWT-based authentication
- Password hashing with bcrypt
- Rate limiting
- CORS protection
- Helmet security headers
- Input validation
- Role-based access control

## Development Notes

- Uses TypeScript for type safety
- MongoDB with Mongoose ODM
- Express.js with middleware architecture
- Comprehensive error handling
- Request validation with express-validator
- Structured logging with Morgan

## Next Phases

This is Phase 2 of the development. Upcoming phases include:
- Phase 3: Frontend Foundation
- Phase 4: User Authentication & Authorization
- Phase 5: Video Streaming System
- Phase 6: Subscription & Payment System
- And more...
