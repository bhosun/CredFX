# Cred Fx Wallet NestJS Application

## Overview
This is a FX Trading application that provides a multi-currency wallet system with user authentication, email verification, and wallet management features. Built with NestJS, Postgres, TypeORM.

## Features
- User registration with email verification (OTP)
- Multi-currency wallet system (NGN, USD, EUR)
- Wallet funding
- Currency Conversion
- Transaction history

## Installation

```bash
# Install dependencies
npm install

# Run the application in development mode
npm run start:dev
```

## Environment Setup
Make sure to update the .env file with your actual database, fxApiKey and Gmail credentials.

# API Documentation

## Base URL
http://localhost:3000/

## API Endpoints

### Authentication
- **POST /auth/register**  
  Register a new user.
  - **Request Body**:
    ```json
    {
      "email": "bhorsun@yahoo.com",
      "password": "Bosun7!"
    }
    ```

- **POST /auth/verify-otp**  
  Verify email with OTP.
  - **Request Body**:
    ```json
    {
      "email": "bhorsun@yahoo.com",
      "otp": "685891"
    }
    ```

### Wallet
- **GET /wallet**  
  Get all user wallets.  
  - **Request Header**:
    ```plaintext
    Authorization: Bearer <JWT_TOKEN>
    ```
  - **Response**:
    ```json
    [
      {
        "userId": "7127106c-aa86-4fd0-a27d-6644a5cffff1",
        "currency": "USD",
        "balance": "0.00000000"
      },
      {
        "userId": "7127106c-aa86-4fd0-a27d-6644a5cffff1",
        "currency": "NGN",
        "balance": "90000.00000000"
      },
      {
        "userId": "7127106c-aa86-4fd0-a27d-6644a5cffff1",
        "currency": "EUR",
        "balance": "5.93000000"
      }
    ]  
    ```

- **GET /wallet/balance**  
  Get balance for a specific currency.  
  - **Request Header**:
    ```plaintext
    Authorization: Bearer <JWT_TOKEN>
    ```
  - **Response**:
    ```json
    {
      "id": "3f45b679-7641-471b-9361-b5dc31de6fab",
      "userId": "7127106c-aa86-4fd0-a27d-6644a5cffff1",
      "currency": "USD",
      "balance": "0.00000000",
      "createdAt": "2025-04-07T08:45:03.086Z",
      "updatedAt": "2025-04-07T15:58:59.427Z"
    }
    ```

- **POST /wallet/fund**  
  Fund wallet.  
  - **Request Body**:
    ```json
    {
      "currency": "NGN",
      "amount": 100000
    }
    ```
  - **Request Header**:
    ```plaintext
    Authorization: Bearer <JWT_TOKEN>
    ```
  - **Response**:
    ```json
    {
      "id": "d7944533-125c-49dc-b4c6-e90021e5f1d9",
      "userId": "7127106c-aa86-4fd0-a27d-6644a5cffff1",
      "type": "FUNDING",
      "currency": "NGN",
      "amount": 100000,
      "status": "COMPLETED",
      "reference": null,
      "description": "Wallet funding - NGN",
      "createdAt": "2025-04-07T21:18:05.852Z"
    }
    ```

- **GET /wallet/transactions**  
  Get transaction history.  
  - **Request Header**:
    ```plaintext
    Authorization: Bearer <JWT_TOKEN>
    ```

### Currency Conversion
- **POST /wallet/convert**  
  Convert currency.  
  - **Request Body**:
    ```json
    {
      "amount": 10000,
      "fromCurrency": "NGN",
      "toCurrency": "EUR"
    }
    ```
  - **Request Header**:
    ```plaintext
    Authorization: Bearer <JWT_TOKEN>
    ```
  - **Response**:
    ```json
    {
      "id": "e51df9ca-6c7d-4004-b415-adbade61bcac",
      "userId": "7127106c-aa86-4fd0-a27d-6644a5cffff1",
      "type": "CONVERSION",
      "currency": "EUR",
      "amount": 5.93,
      "status": "COMPLETED",
      "reference": "CONV-1744060703169-7127106c",
      "description": "Currency conversion: 10000 NGN to 5.93 EUR",
      "createdAt": "2025-04-07T21:18:23.155Z"
    }
    ```

- **GET /fx/rates**  
  Get the latest currency exchange rates.  
  - **Request Header**:
    ```plaintext
    Authorization: Bearer <JWT_TOKEN>
    ```
  - **Response**:
    ```json
    {
      "rates": {
        "NGN": 1,
        "USD": 0.000654,
        "EUR": 0.00059316,
        "GBP": 0.0005041
      },
      "lastUpdated": "2025-04-07T21:53:48.863Z",
      "nextUpdate": "2025-04-08T00:00:01.000Z"
    }
    ```

## Key Assumptions
- **Multi-currency Support**: The app supports NGN, USD, EUR and GBP with the potential for more currencies.
- **Secure Authentication**: Users are authenticated via JWT tokens for a secure experience.
- **Real-time Rates**: Exchange rates are fetched from an external service and updated regularly for currency conversion.

## Architectural Decisions

### Separation of Concerns
- **Controllers**: Handle request routing, validation, and delegation.
- **Services**: Contain business logic (e.g., wallet funding, currency conversion) and interact with repositories.

### Database Transaction Management
- **Atomic Transactions**: Ensured using `queryRunner` for wallet updates and currency conversions.
- **Pessimistic Locking**: Prevents race conditions and double spending during wallet updates.

### API Integration
- **External Exchange API**: Used for real-time currency conversions with graceful failure handling in case of downtime or issues.

### Error Handling & Response Consistency
- **Custom Exceptions**: Implemented for consistent error handling (e.g., `BadRequestException`, `InternalServerErrorException`).
- **Clear Responses**: Meaningful response codes and messages for clients.

### Scalable Architecture
- **Microservice-like Approach**: Isolated services for concerns like wallet and exchange management.
- **Horizontal Scaling**: Designed for scalability and efficient traffic handling.



## Database Schema
- Users: Stores user information and verification details
- Wallets: Multi-currency wallets linked to users
- Transactions: History of all wallet operations

