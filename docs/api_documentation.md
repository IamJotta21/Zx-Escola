# 🌐 API Route Documentation

This document describes primary backend routes, required payloads, headers, and access roles for the **Zx-Escola** API.

---

## 🌎 1. Deployed Base URL

- **Production API URL**: `https://zx-escola.vercel.app/api`
- **Content Type**: `application/json`
- **Authentication**: Bearer JWT tokens passed in the `Authorization` header:
  ```http
  Authorization: Bearer <your_jwt_access_token>
  ```

---

## 🔒 2. Authentication Routes

### Login
- **Route**: `POST /api/auth/login`
- **Access**: Public
- **Request Payload**:
  ```json
  {
    "email": "admin@zxescola.com.br",
    "password": "your_secure_password"
  }
  ```
- **Response Example**:
  ```json
  {
    "status": "success",
    "data": {
      "accessToken": "eyJhbGciOi...",
      "refreshToken": "eyJhbGciOi...",
      "user": {
        "id": "768393e1-...",
        "email": "admin@zxescola.com.br",
        "role": "ADMIN"
      }
    }
  }
  ```

### Refresh Token
- **Route**: `POST /api/auth/refresh`
- **Access**: Public
- **Request Payload**:
  ```json
  {
    "refreshToken": "eyJhbGciOi..."
  }
  ```
- **Response**: Returns a fresh `accessToken`.

---

## 🎒 3. Student Routes

### List Students
- **Route**: `GET /api/students`
- **Access**: `ADMIN`, `DIRECTOR`, `STAFF`, `TEACHER`
- **Query Parameters**:
  - `page` (default 1)
  - `limit` (default 10)
  - `search` (name or CPF search string)
- **Response Example**:
  ```json
  {
    "status": "success",
    "data": {
      "total": 1,
      "page": 1,
      "limit": 10,
      "students": [
        {
          "id": "e98e29a8-...",
          "cpf": "123.456.789-00",
          "status": "MATRICULADO",
          "user": {
            "profile": {
              "firstName": "João",
              "lastName": "Silva"
            }
          }
        }
      ]
    }
  }
  ```

---

## 📊 4. Reports & Audits

### Get Analytical Dashboard Metrics
- **Route**: `GET /api/reports`
- **Access**: `ADMIN`, `DIRECTOR` (Requires authentic session)
- **Response**: Aggregated metrics of financial status (balances, monthly cash flows), tuition indexes (paid/unpaid splits), and academic performance counts.
- **Cache Header behavior**: Responses are cached in memory for 5 minutes (300 seconds) to avoid database latency.
