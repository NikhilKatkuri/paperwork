# Authentication API

Base path: `/api/v1/auth`.

Bearer-protected routes use `Authorization: Bearer <access_token>`. Refresh, 2FA, and verification flows also use HTTP-only cookies set by the server.

| Method | Path | Auth | Input | Success |
| --- | --- | --- | --- | --- |
| POST | `/api/v1/auth/sign-up` | Public | `{ email, password, fullName }` | `201`, access token and refresh cookie |
| POST | `/api/v1/auth/sign-in` | Public | `{ email, password }` | `200`, access token or 2FA challenge |
| POST | `/api/v1/auth/sign-in/2fa/:otp` | Temporary 2FA cookies | `otp` path parameter | `200`, access token |
| POST | `/api/v1/auth/sign-out` | Bearer + refresh cookie | None | `200` |
| POST | `/api/v1/auth/refresh-token` | Refresh cookie | None | `200`, rotated access/refresh tokens |
| GET | `/api/v1/auth/me` | Bearer | None | `200`, profile |
| POST | `/api/v1/auth/me` | Bearer | `{ fullName, bio, avatarUrl }` | `200`, updated profile |
| POST | `/api/v1/auth/send-verification` | Bearer | None | `200` |
| POST | `/api/v1/auth/verify-email` | Bearer + verification cookie | `{ otp }` | `200` |
| POST | `/api/v1/auth/change-password` | Bearer | `{ currentPassword, newPassword }` | `200` |
| POST | `/api/v1/auth/forgot-password` | Public | `{ email }` | `200` |
| POST | `/api/v1/auth/reset-password/:token` | Public | `{ newPassword }` | `200` |
| POST | `/api/v1/auth/check-email` | Public | `{ email }` | `200`, `{ exists }` |
| GET | `/api/v1/auth/account` | Bearer | None | `200`, account status |
| POST | `/api/v1/auth/account/action` | Bearer | `{ action, password }` | `200` |
| POST | `/api/v1/auth/account/personal` | Bearer | `{ dob, gender, country, language }` | `200` |
| GET | `/api/v1/auth/account/personal` | Bearer | None | `200`, personal information |
| PUT | `/api/v1/auth/account/personal` | Bearer | Any subset of personal fields | `200` |

## Examples

Sign in:

```json
{
  "email": "user@example.com",
  "password": "correct horse battery staple"
}
```

A normal sign-in returns:

```json
{
  "success": true,
  "message": "User signed in successfully",
  "accessToken": "<jwt>"
}
```

When 2FA is enabled, the response contains `twoFactorRequired: true`; complete the flow with the OTP route.

## Errors

Validation failures return `400` with `success: false`, `message: "Validation failed"`, and `errors`. Missing or invalid authentication returns `401`. Other service errors may return `400`, `404`, `409`, or `500`; rate limits return `429`.

The route table currently has no validation middleware for `verify-email`, `change-password`, or `reset-password/:token`, although those controllers read the documented body fields.
