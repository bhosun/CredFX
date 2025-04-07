# Cred Fx Wallet NestJS Application

## Overview
This is a NestJS application that provides a multi-currency wallet system with user authentication, email verification, and wallet management features.

## Features
- User registration with email verification (OTP)
- JWT-based authentication
- Multi-currency wallet system (NGN, USD, EUR)
- Wallet funding
- Transaction history

## Installation

```bash
# Install dependencies
npm install

# Run the application in development mode
npm run start:dev
```

## Environment Setup
Make sure to update the .env file with your actual database and Gmail credentials.

## API Endpoints

### Authentication
- POST /auth/register - Register a new user
- POST /auth/verify-otp - Verify email with OTP
- POST /auth/login - Login user
- POST /auth/resend-otp - Resend verification OTP

### Wallet
- GET /wallet - Get all user wallets
- GET /wallet/balance - Get balance for a specific currency
- POST /wallet/fund - Fund wallet
- GET /wallet/transactions - Get transaction history

## Database Schema
- Users: Stores user information and verification details
- Wallets: Multi-currency wallets linked to users
- Transactions: History of all wallet operations

## Notes
- The application uses TypeORM with PostgreSQL.
- JWT is used for authentication and protecting routes.

