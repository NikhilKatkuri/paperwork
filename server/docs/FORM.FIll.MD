# Form Submission API Documentation

Guide for submitting form responses and retrieving submission data.  
See [SCHEMA.README.MD](SCHEMA.README.MD) for detailed response schema.

---

## Submit Form Response

**Endpoint**: `POST /api/forms/:formId/fill`  
**Authentication**: Required  
**Description**: Submits user responses to a form

**Request Body**:

```json
{
    "data": {
        "email": "user@example.com",
        "answers": [
            {
                "questionId": "q_name123",
                "values": ["John Doe"]
            },
            {
                "questionId": "q_age456",
                "values": ["25-35"]
            },
            {
                "questionId": "q_platforms789",
                "values": ["web", "mobile"]
            }
        ]
    }
}
```

**Response** (201 Created):

```json
{
    "data": {
        "_id": "response_abc123",
        "formId": "form456",
        "userId": "user789",
        "email": "user@example.com",
        "answers": [
            {
                "questionId": "q_name123",
                "values": ["John Doe"]
            },
            {
                "questionId": "q_age456",
                "values": ["25-35"]
            },
            {
                "questionId": "q_platforms789",
                "values": ["web", "mobile"]
            }
        ],
        "metadata": {
            "userAgent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)...",
            "ipAddress": "192.168.1.1"
        },
        "createdAt": "2026-05-29T10:30:00Z",
        "updatedAt": "2026-05-29T10:30:00Z"
    },
    "message": "Form submission successful"
}
```

---

## Answer Format by Question Type

### Text/Paragraph Response

```json
{
    "questionId": "q_name",
    "values": ["John Doe"]
}
```

### Single Choice (Radio)

```json
{
    "questionId": "q_experience",
    "values": ["intermediate"]
}
```

### Multiple Choice (Checkboxes)

```json
{
    "questionId": "q_platforms",
    "values": ["web", "mobile", "desktop"]
}
```

### Rating/Scale

```json
{
    "questionId": "q_satisfaction",
    "values": ["5"] // Note: Always array format
}
```

### Date/Time

```json
{
    "questionId": "q_birthdate",
    "values": ["1995-03-15"]
}
```

---

## Get Form Responses

**Endpoint**: `GET /api/forms/:formId/responses`  
**Authentication**: Required  
**Description**: Retrieves all responses submitted to a form

**Query Parameters**:

- `page`: Page number (default: 1)
- `limit`: Responses per page (default: 10)
- `email`: Filter by email address
- `userId`: Filter by user ID

**Response** (200 OK):

```json
{
    "data": [
        {
            "_id": "response_abc123",
            "formId": "form456",
            "userId": "user789",
            "email": "user@example.com",
            "answers": [
                /* answers array */
            ],
            "metadata": {
                "userAgent": "Mozilla/5.0...",
                "ipAddress": "192.168.1.1"
            },
            "createdAt": "2026-05-29T10:30:00Z"
        }
    ],
    "pagination": {
        "total": 45,
        "page": 1,
        "limit": 10,
        "pages": 5
    },
    "message": "Responses retrieved successfully"
}
```

---

## Get Single Response

**Endpoint**: `GET /api/forms/:formId/responses/:responseId`  
**Authentication**: Required

**Response** (200 OK): Returns single response object

---

## Update Response (Edit Submission)

**Endpoint**: `PATCH /api/forms/:formId/responses/:responseId`  
**Authentication**: Required  
**Requires**: Form setting `allowEditResponse: true`

**Request Body**:

```json
{
    "data": {
        "answers": [
            {
                "questionId": "q_name123",
                "values": ["Jane Doe"]
            }
        ]
    }
}
```

**Response** (200 OK):

```json
{
    "data": {
        "_id": "response_abc123",
        "formId": "form456",
        "answers": [
            /* updated answers */
        ],
        "updatedAt": "2026-05-29T11:00:00Z"
    },
    "message": "Response updated successfully"
}
```

---

## Delete Response

**Endpoint**: `DELETE /api/forms/:formId/responses/:responseId`  
**Authentication**: Required

**Response** (200 OK):

```json
{
    "message": "Response deleted successfully"
}
```

---

## Response Analytics

**Endpoint**: `GET /api/forms/:formId/responses/analytics`  
**Authentication**: Required  
**Description**: Gets aggregated response data

**Response** (200 OK):

```json
{
    "data": {
        "totalResponses": 45,
        "averageCompletionTime": 180,
        "completionRate": 0.92,
        "responsesByDate": [
            {
                "date": "2026-05-29",
                "count": 12
            }
        ],
        "answersByQuestion": {
            "q_experience": {
                "beginner": 5,
                "intermediate": 20,
                "expert": 20
            },
            "q_satisfaction": {
                "avg": 4.2,
                "distribution": [1, 2, 5, 15, 22]
            }
        }
    },
    "message": "Analytics retrieved successfully"
}
```

---

## Export Responses

**Endpoint**: `GET /api/forms/:formId/responses/export`  
**Authentication**: Required  
**Query Parameters**:

- `format`: `csv` or `json` (default: json)

**Response**:

- CSV: Downloadable CSV file
- JSON: JSON array of responses

---

## Error Responses

### 400 Bad Request - Missing Answers

```json
{
    "status": 400,
    "message": "Validation failed",
    "errors": [
        {
            "field": "answers",
            "message": "Must provide at least one answer"
        }
    ]
}
```

### 422 Unprocessable Entity - Duplicate Submission

```json
{
    "status": 422,
    "message": "User has already submitted this form",
    "message": "Set allowEditResponse=true to allow resubmission"
}
```

### 422 Unprocessable Entity - Required Field Missing

```json
{
    "status": 422,
    "message": "Validation failed",
    "errors": [
        {
            "questionId": "q_email123",
            "message": "This question is required"
        }
    ]
}
```

### 422 Unprocessable Entity - Validation Rule Failed

```json
{
    "status": 422,
    "message": "Validation failed",
    "errors": [
        {
            "questionId": "q_email123",
            "message": "Please enter a valid email address"
        }
    ]
}
```

### 409 Conflict - Form Closed

```json
{
    "status": 409,
    "message": "Form is no longer accepting responses",
    "reason": "maxResponses reached or form is closed"
}
```

---

## Response Constraints

- **Uniqueness**: One response per `{formId, userId}` unless `allowEditResponse: true`
- **Max Responses**: Limited by `settings.maxResponses`
- **Per User Limit**: Limited by `settings.maxResponsesPerUser`
- **Time Window**: Limited by `settings.startDate`, `settings.closeDate`
- **Time Limit**: Individual response must complete within `settings.timeLimitPerResponse` seconds

---

## Best Practices

1. **Always include email** when `form.settings.collectEmail: true`
2. **Use correct answer format** - Always wrap values in array: `"values": ["answer"]`
3. **Handle rate limits** - Don't submit more than 100 requests per 15 minutes
4. **Validate client-side** before submitting to reduce errors
5. **Store response IDs** for follow-ups or edits

---

## Next Steps

- [Back to Forms](FORMS.README.MD)
- [View Schema Documentation](SCHEMA.README.MD)
