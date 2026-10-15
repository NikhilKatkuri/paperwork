# Form Fill and Responses API

Base path: `/api/v1/forms/:formId/fill`

All routes require a bearer access token.

## Get a form to fill

`GET /api/v1/forms/:formId/fill`

Returns `200` with the form data under `data`. The service may serve a cached published form or load it from the database.

## Submit answers

`POST /api/v1/forms/:formId/fill`

The body is an array under `data`:

```json
{
  "data": [
    { "questionId": "6a18cd6d1f892e03d087047f", "values": ["John Doe"] },
    { "questionId": "6a18cd6d1f892e03d0870480", "values": ["web", "mobile"] }
  ]
}
```

Each `questionId` must be a valid ObjectId and `values` must contain at least one string. The authenticated user's email and request metadata are added by the server. The submission is queued asynchronously. Success is `202 Accepted`:

```json
{
  "success": true,
  "message": "Submission received",
  "data": { "submissionId": "6a18cd6d1f892e03d0870490" }
}
```

## Poll submission status

`GET /api/v1/forms/:formId/fill/submissions/:submissionId/status`

Returns `200` with the status object, for example:

```json
{
  "success": true,
  "data": {
    "submissionId": "6a18cd6d1f892e03d0870490",
    "status": "pending",
    "formId": "6a18cd6d1f892e03d087047f",
    "createdAt": 1760000000000
  }
}
```

The status record expires after one hour. Missing or expired records return `404`.

## Read responses

| Method | Path | Query | Success |
| --- | --- | --- | --- |
| GET | `/api/v1/forms/:formId/fill/responses` | `page`, `limit` | `200`, `{ data: responses, pagination }` |
| GET | `/api/v1/forms/:formId/fill/responses/:responseId` | None | `200`, `{ data: response }` |
| GET | `/api/v1/forms/:formId/fill/responses/export/:exportType` | None | `200`, `{ data: exported }` |

Response listing defaults to page `1` and limit `20`. An empty result returns `200` with `data: []` and a message. `exportType` is supplied as a path parameter and is passed to the export service.

A stored response contains `formId`, authenticated `userId`, email, `answers`, request `metadata` (`userAgent`, `ipAddress`), and timestamps. Response editing, deletion, analytics, and query filters are not currently registered routes.
