# AUTH API ENDPOINTS

This document provides an overview of the authentication API endpoints available in the Paperwork application. These endpoints allow users to sign up, sign in, refresh their access tokens, and sign out.

## Sign Up

- **Endpoint**: `POST /auth/signup`
- **Description**: Registers a new user with the provided email and password.
- **Request Body**:

```
{
    "email": "knikhi@example.com",
    "password": "supersecurepassword123",
    "fullName": "knikhi"
}
```

- **Response**:

```
{
    "success": true,
    "message": "User registered successfully",
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI2YTE3ZTJhZDIyMDMwNTRhMjU1YmEzODgiLCJlbWFpbCI6ImtuaWtoaUBleGFtcGxlLmNvbSIsImlhdCI6MTc3OTk1MDI1NCwiZXhwIjoxNzc5OTUxMTU0fQ.iN6O9vgtW1lk_oHvY0tlrM8i4JbGM2RMXBJJaTU_bNg"
}
```

- **Error Response**:

```
{
    "success": false,
    "message": "Email already in use"
}
```

## Sign In

- **Endpoint**: `POST /auth/signin`
- **Description**: Authenticates a user with the provided email and password, returning an access token and a refresh token.
- **Request Body**:

```
{
"email": "knikhi@example.com",
"password": "supersecurepassword123",
"fullName": "knikhi"
}
```

- **Response**:

```{
"success": true,
"message": "User signed in successfully",
"accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI2YTE3ZTJhZDIyMDMwNTRhMjU1YmEzODgiLCJlbWFpbCI6ImtuaWtoaUBleGFtcGxlLmNvbSIsImlhdCI6MTc3OTk1MDM4NCwiZXhwIjoxNzc5OTUxMjg0fQ.ExGuXg075qSGArMXNWY50EOVEvuUXA--KO4DeDgLs8M"
}
```

- **Error Response**:

```
{
    "success": false,
    "message": "Invalid email or password"
}
```

## Refresh Token

- **Endpoint**: `POST /auth/refresh-token`
- **Authentication**: Requires a valid access token in the `Authorization` header (e.g., `Bearer <access_token>`).
- **Description**: Refreshes the access token using a valid refresh token.
- **Request Body**:

```
{
"success": true,
"message": "Token refreshed successfully",
"accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI2YTE3ZTJhZDIyMDMwNTRhMjU1YmEzODgiLCJlbWFpbCI6ImtuaWtoaUBleGFtcGxlLmNvbSIsImlhdCI6MTc3OTk1MDQ3NSwiZXhwIjoxNzc5OTUxMzc1fQ.8TAw0adNsRQN6Ul5sR992wSOKbiBtcsb8TkNsyscyDc"
}
```

- **Error Response**:

```
{
    "success": false,
    "message": "Invalid refresh token"
}
```

## Sign Out

- **Endpoint**: `POST /auth/signout`
- **Authentication**: Requires a valid access token in the `Authorization` header (e.g., `Bearer <access_token>`).
- **Description**: Signs out the user by invalidating the refresh token.
- **Request Body**:

```
{
"success": true,
"message": "Logged out successfully"
}
```

- **Error Response**:

```
{
    "success": false,
    "message": "Invalid refresh token"
}
```

## ME

- **Endpoint**: `GET /auth/me`
- **Authentication**: Requires a valid access token in the `Authorization` header (e.g., `Bearer <access_token>`).
- **Description**: Retrieves the authenticated user's information.
- **Response**:

````
{
    "success": true,
    "message": "Profile retrieved successfully",
    "data": {
        "profile": {
            "_id": "6a17e2ae2203054a255ba389",
            "userId": "6a17e2ad2203054a255ba388",
            "fullName": "knikhi",
            "createdAt": "2026-05-28T06:37:34.039Z",
            "updatedAt": "2026-05-28T06:37:34.039Z"
        }
    }
}```
````

- **Error Response**:

```
{
    "success": false,
    "message": "Unauthorized"
}
```
