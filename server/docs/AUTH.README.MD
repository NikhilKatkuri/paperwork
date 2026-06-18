# Paperwork — Auth API Reference

A complete reference for all authentication and account management endpoints in the Paperwork application.

---

## Table of Contents

- [Base URL & Authentication](#base-url--authentication)
- [Authentication Endpoints](#authentication-endpoints)
    - [Sign Up](#sign-up)
    - [Sign In](#sign-in)
    - [Verify 2FA](#verify-2fa)
    - [Refresh Token](#refresh-token)
    - [Sign Out](#sign-out)
- [User Profile](#user-profile)
    - [Get Profile](#get-profile)
    - [Update Profile](#update-profile)
- [Email Verification](#email-verification)
    - [Send Verification Email](#send-verification-email)
    - [Verify Email](#verify-email)
- [Password Management](#password-management)
    - [Change Password](#change-password)
    - [Forgot Password](#forgot-password)
    - [Reset Password](#reset-password)
- [Account Actions](#account-actions)
- [Personal Information](#personal-information)
    - [Add Personal Information](#add-personal-information)
    - [Get Personal Information](#get-personal-information)
    - [Update Personal Information](#update-personal-information)
- [Error Responses](#error-responses)

---

## Base URL & Authentication

All endpoints are prefixed with `/auth`.

Protected endpoints require a valid JWT access token in the `Authorization` header:

```
Authorization: Bearer <access_token>
```

---

## Authentication Endpoints

### Sign Up

Registers a new user account.

- **Method:** `POST`
- **Endpoint:** `/auth/sign-up`
- **Auth required:** No

**Request Body**

```json
{
    "email": "user@example.com",
    "password": "supersecurepassword123",
    "fullName": "John Doe"
}
```

**Success Response** `200 OK`

```json
{
    "success": true,
    "message": "User registered successfully",
    "accessToken": "<jwt_token>"
}
```

**Error Response**

```json
{
    "success": false,
    "message": "Email already in use"
}
```

---

### Sign In

Authenticates a user and returns an access token.

- **Method:** `POST`
- **Endpoint:** `/auth/sign-in`
- **Auth required:** No

**Request Body**

```json
{
    "email": "user@example.com",
    "password": "supersecurepassword123"
}
```

**Success Response** `200 OK`

```json
{
    "success": true,
    "message": "User signed in successfully",
    "accessToken": "<jwt_token>"
}
```

**2FA Response** (when two-factor authentication is enabled)

```json
{
    "success": true,
    "twoFactorRequired": true,
    "message": "2FA OTP sent to your email. Please verify."
}
```

**Error Response**

```json
{
    "success": false,
    "message": "Invalid email or password"
}
```

---

### Verify 2FA

Completes sign-in when 2FA is enabled. Must be called from the same browser session immediately after receiving the 2FA prompt.

- **Method:** `POST`
- **Endpoint:** `/auth/sign-in/2fa/:otp`
- **Auth required:** No (session context required)

**URL Parameter**

| Param | Type   | Description                  |
| ----- | ------ | ---------------------------- |
| `otp` | string | One-time password from email |

**Success Response** `200 OK`

```json
{
    "success": true,
    "message": "User signed in successfully",
    "accessToken": "<jwt_token>"
}
```

---

### Refresh Token

Issues a new access token using the current refresh token stored in the session.

- **Method:** `POST`
- **Endpoint:** `/auth/refresh-token`
- **Auth required:** Yes

**Success Response** `200 OK`

```json
{
    "success": true,
    "message": "Token refreshed successfully",
    "accessToken": "<jwt_token>"
}
```

**Error Response**

```json
{
    "success": false,
    "message": "Invalid refresh token"
}
```

---

### Sign Out

Invalidates the user's refresh token and ends the session.

- **Method:** `POST`
- **Endpoint:** `/auth/signout`
- **Auth required:** Yes

**Success Response** `200 OK`

```json
{
    "success": true,
    "message": "Logged out successfully"
}
```

**Error Response**

```json
{
    "success": false,
    "message": "Invalid refresh token"
}
```

---

## User Profile

### Get Profile

Retrieves the authenticated user's profile.

- **Method:** `GET`
- **Endpoint:** `/auth/me`
- **Auth required:** Yes

**Success Response** `200 OK`

```json
{
    "success": true,
    "message": "Profile retrieved successfully",
    "data": {
        "profile": {
            "_id": "6a17e2ae2203054a255ba389",
            "userId": "6a17e2ad2203054a255ba388",
            "fullName": "John Doe",
            "createdAt": "2026-05-28T06:37:34.039Z",
            "updatedAt": "2026-05-28T06:37:34.039Z"
        }
    }
}
```

**Error Response**

```json
{
    "success": false,
    "message": "Unauthorized"
}
```

---

### Update Profile

Updates the authenticated user's profile fields.

- **Method:** `POST`
- **Endpoint:** `/auth/me`
- **Auth required:** Yes

**Request Body** (all fields optional)

```json
{
    "fullName": "John Doe",
    "bio": "Software Engineer",
    "avatarUrl": "https://example.com/avatar.png"
}
```

**Success Response** `200 OK`

```json
{
    "success": true,
    "message": "Profile updated successfully",
    "data": {
        "profile": {
            "_id": "6a32d5b226f5133981648e95",
            "userId": "6a32d5b226f5133981648e94",
            "fullName": "John Doe",
            "bio": "Software Engineer",
            "avatarUrl": "https://example.com/avatar.png",
            "createdAt": "2026-06-17T17:13:22.434Z",
            "updatedAt": "2026-06-18T12:56:07.908Z"
        }
    }
}
```

**Error Response**

```json
{
    "success": false,
    "message": "Unauthorized"
}
```

---

## Email Verification

### Send Verification Email

Sends a verification OTP to the user's registered email address.

- **Method:** `POST`
- **Endpoint:** `/auth/send-verification`
- **Auth required:** Yes

**Success Response** `200 OK`

```json
{
    "success": true,
    "message": "Verification email sent successfully"
}
```

**Error Response**

```json
{
    "success": false,
    "message": "Failed to send verification email"
}
```

---

### Verify Email

Verifies the user's email address using the OTP received in the verification email.

- **Method:** `POST`
- **Endpoint:** `/auth/verify-email`
- **Auth required:** Yes

**Request Body**

```json
{
    "otp": "123456"
}
```

**Success Response** `200 OK`

```json
{
    "success": true,
    "message": "Email verified successfully"
}
```

**Error Response**

```json
{
    "success": false,
    "message": "Invalid or expired verification token"
}
```

---

## Password Management

### Change Password

Changes the authenticated user's password.

- **Method:** `POST`
- **Endpoint:** `/auth/change-password`
- **Auth required:** Yes

**Request Body**

```json
{
    "currentPassword": "current_password",
    "newPassword": "new_secure_password123"
}
```

**Success Response** `200 OK`

```json
{
    "success": true,
    "message": "Password changed successfully"
}
```

**Error Response**

```json
{
    "success": false,
    "message": "Current password is incorrect"
}
```

---

### Forgot Password

Initiates password reset by sending a reset link to the user's email.

- **Method:** `POST`
- **Endpoint:** `/auth/forgot-password`
- **Auth required:** No

**Request Body**

```json
{
    "email": "user@example.com"
}
```

**Success Response** `200 OK`

```json
{
    "success": true,
    "message": "Password reset email sent successfully"
}
```

---

### Reset Password

Resets the user's password using the token received in the reset email.

- **Method:** `POST`
- **Endpoint:** `/auth/reset-password/:token`
- **Auth required:** No

**URL Parameter**

| Param   | Type   | Description                          |
| ------- | ------ | ------------------------------------ |
| `token` | string | Password reset token from email link |

**Request Body**

```json
{
    "newPassword": "new_secure_password123"
}
```

**Success Response** `200 OK`

```json
{
    "success": true,
    "message": "Password reset successfully"
}
```

**Error Response**

```json
{
    "success": false,
    "message": "Invalid or expired password reset token"
}
```

---

## Account Actions

Performs security-sensitive account operations (enable/disable 2FA, deactivate or delete account).

- **Method:** `POST`
- **Endpoint:** `/auth/account/action`
- **Auth required:** Yes

**Action Types**

| Action             | Description                        |
| ------------------ | ---------------------------------- |
| `enable-2fa`       | Enables two-factor authentication  |
| `disable-2fa`      | Disables two-factor authentication |
| `deactive-account` | Deactivates the account            |
| `delete-account`   | Permanently deletes the account    |

**Request Body**

```json
{
    "action": "enable-2fa",
    "password": "your_password"
}
```

**Success Response** `200 OK`

```json
{
    "success": true,
    "message": "Account enable-2fa successful",
    "data": {
        "_id": "6a32d5b226f5133981648e94",
        "twofactorEnabled": true
    }
}
```

**Error Response**

```json
{
    "success": false,
    "message": "Account action unavailable"
}
```

---

## Personal Information

Manages sensitive demographic data stored within the user's profile. All endpoints require authentication and observe rate limiting.

- **Base Route:** `/auth/account/personal`
- **Auth required:** Yes
- **Headers:** `Content-Type: application/json`

### Field Reference

| Field      | Type   | Description               | Example      |
| ---------- | ------ | ------------------------- | ------------ |
| `dob`      | string | Date of birth (ISO 8601)  | `YYYY-MM-DD` |
| `gender`   | string | Gender (enum)             | `"MALE"`     |
| `country`  | string | ISO country code (enum)   | `"USA"`      |
| `language` | string | Preferred language (enum) | `"ENGLISH"`  |

---

### Add Personal Information

Initializes the personal information block for a profile that has none set yet.

- **Method:** `POST`
- **Endpoint:** `/auth/account/personal`
- **Rate limiter:** `actionLimiter`

**Request Body** (all fields optional)

```json
{
    "dob": "1995-04-15",
    "gender": "MALE",
    "country": "USA",
    "language": "ENGLISH"
}
```

**Responses**

| Status                  | Description                             |
| ----------------------- | --------------------------------------- |
| `200 OK`                | Personal information saved successfully |
| `400 Bad Request`       | Invalid or unrecognized field values    |
| `401 Unauthorized`      | Missing or expired access token         |
| `429 Too Many Requests` | Rate limit exceeded                     |

---

### Get Personal Information

Retrieves the authenticated user's personal information.

- **Method:** `GET`
- **Endpoint:** `/auth/account/personal`
- **Rate limiter:** `profileGetterLimiter`

**Success Response** `200 OK`

```json
{
    "success": true,
    "message": "retrieved successfully",
    "data": {
        "dob": "1995-04-15T00:00:00.000Z",
        "gender": "MALE",
        "country": "USA",
        "language": "ENGLISH"
    }
}
```

**Error Response** `401 Unauthorized`

```json
{
    "success": false,
    "message": "Unauthorized"
}
```

---

### Update Personal Information

Partially or fully updates existing personal information fields.

- **Method:** `PUT`
- **Endpoint:** `/auth/account/personal`
- **Rate limiter:** `actionLimiter`

**Request Body** (include only fields to update)

```json
{
    "country": "CANADA",
    "language": "FRENCH"
}
```

**Responses**

| Status             | Description                          |
| ------------------ | ------------------------------------ |
| `200 OK`           | Fields updated successfully          |
| `400 Bad Request`  | Payload fails validation constraints |
| `401 Unauthorized` | Session expired or invalid token     |

---

## Error Responses

All endpoints return a consistent error shape:

```json
{
    "success": false,
    "message": "<description of the error>"
}
```

Common error messages across the API:

| Message                                      | Cause                                     |
| -------------------------------------------- | ----------------------------------------- |
| `Unauthorized`                               | Missing, invalid, or expired access token |
| `Invalid email or password`                  | Sign-in credentials don't match           |
| `Email already in use`                       | Registration with a duplicate email       |
| `Invalid refresh token`                      | Refresh/sign-out with a bad token         |
| `Invalid or expired verification token`      | Email OTP is stale or incorrect           |
| `Invalid or expired password reset token`    | Reset token is stale or incorrect         |
| `Current password is incorrect`              | Wrong password on change-password         |
| `Too many attempts, please try again later.` | Rate limit exceeded                       |
