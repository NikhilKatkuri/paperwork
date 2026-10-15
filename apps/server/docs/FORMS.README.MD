# Forms API

Base path: `/api/v1/forms`

All form routes require `Authorization: Bearer <access_token>`.
Request bodies use a top-level `data` property. IDs are 24-character hexadecimal MongoDB ObjectIds.

## Form fields

```json
{
  "name": "Customer feedback",
  "isPrivate": false,
  "isPublished": false,
  "allowedDomains": [],
  "settings": {
    "maxResponses": 500,
    "maxResponsesPerUser": 1,
    "startDate": "2026-06-01T09:00:00.000Z",
    "closeDate": "2026-12-31T23:59:59.000Z",
    "timeLimitPerResponse": 1800,
    "collectEmail": true,
    "shuffleQuestions": false,
    "allowEditResponse": false,
    "saveAndContinueLater": false,
    "progressBar": true,
    "customConfirmationMessage": "Thanks",
    "redirectUrl": "https://example.com/thanks"
  }
}
```

`name` is required. `isPrivate` and `isPublished` default to `false`. `allowedDomains` is intended for private forms. Settings limits must be positive; dates are coerced to dates; `redirectUrl` must be a URL.

## Routes

| Method | Path | Body | Success |
| --- | --- | --- | --- |
| GET | `/api/v1/forms` | Query: `page`, `limit`, `lastUpdated` | `200`, `{ data: { forms } }` |
| POST | `/api/v1/forms` | `{ data: form }` | `201`, `{ data: { form } }` |
| GET | `/api/v1/forms/:formId` | None | `200`, `{ data: { form } }` |
| PUT | `/api/v1/forms/:formId` | `{ data: form }` | `200`, `{ data: { form } }` |
| PATCH | `/api/v1/forms/:formId` | `{ data: partialForm }` | `200`, `{ data: { form } }` |
| PUT | `/api/v1/forms/:formId/bulk` | `{ data: form, sections?, questions? }` | `200`, `{ data: form }` |
| DELETE | `/api/v1/forms/:formId` | None | `204`, no body |
| POST | `/api/v1/forms/:formId/publish` | None | `200`, `{ data: { form } }` |
| POST | `/api/v1/forms/:formId/unpublish` | None | `200`, `{ data: { form } }` |
| POST | `/api/v1/forms/:formId/duplicate` | None | `201`, `{ data: { form } }` |

The list endpoint clamps `page` to at least `1` and `limit` to `1..100`; defaults are page `1`, limit `10`.

## Bulk update

The bulk body is a form object plus optional complete arrays:

```json
{
  "data": {
    "name": "Updated form",
    "isPrivate": false,
    "isPublished": false,
    "sections": [
      {
        "_id": "6a18cd6d1f892e03d087047f",
        "index": 0,
        "title": "Introduction",
        "description": "Start here",
        "defaultAction": { "actionType": "NEXT_SECTION" },
        "onAnswer": []
      }
    ],
    "questions": []
  }
}
```

Bulk questions include `_id` and `index`; question-specific fields are documented in [FORMS.QUESTIONS.MD](FORMS.QUESTIONS.MD).

## Common response and errors

Successful responses include `success: true`, a message, and route-specific `data`. Validation errors use `400` with `success: false`, `message`, and `errors`. Authentication and authorization failures use `401` or `403`; missing resources use `404`; rate limits use `429`.

See [FORMS.SECTIONS.MD](FORMS.SECTIONS.MD), [FORMS.QUESTIONS.MD](FORMS.QUESTIONS.MD), [FORM.FIll.MD](FORM.FIll.MD), and [SCHEMA.README.MD](SCHEMA.README.MD).
