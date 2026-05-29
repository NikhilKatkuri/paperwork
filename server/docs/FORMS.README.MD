# Forms API Documentation

Complete guide for working with forms. See [SCHEMA.README.MD](SCHEMA.README.MD) for detailed schema definitions.

---

## Creating a Form

**Endpoint**: `POST /api/forms`  
**Authentication**: Required  
**Description**: Creates a new form

**Request Body**:

```json
{
    "data": {
        "title": "Customer Feedback Survey",
        "description": "Help us improve our services",
        "isPrivate": false,
        "isPublished": true,
        "allowedDomains": [],
        "settings": {
            "maxResponses": 500,
            "maxResponsesPerUser": 1,
            "collectEmail": true,
            "shuffleQuestions": false,
            "allowEditResponse": false,
            "saveAndContinueLater": true,
            "progressBar": true,
            "customConfirmationMessage": "Thank you for your feedback!",
            "redirectUrl": "https://example.com/thank-you"
        }
    }
}
```

**Response** (201 Created):

```json
{
    "data": {
        "_id": "form123",
        "userId": "user456",
        "title": "Customer Feedback Survey",
        "description": "Help us improve our services",
        "isPrivate": false,
        "isPublished": true,
        "allowedDomains": [],
        "settings": {
            "maxResponses": 500,
            "maxResponsesPerUser": 1,
            "collectEmail": true,
            "shuffleQuestions": false,
            "allowEditResponse": false,
            "saveAndContinueLater": true,
            "progressBar": true,
            "customConfirmationMessage": "Thank you for your feedback!",
            "redirectUrl": "https://example.com/thank-you"
        },
        "createdAt": "2026-05-29T10:00:00Z",
        "updatedAt": "2026-05-29T10:00:00Z"
    },
    "message": "Form created successfully"
}
```

---

## Retrieve a Form

**Endpoint**: `GET /api/forms/:formId`  
**Authentication**: Required  
**Description**: Retrieves complete form with all sections and questions

**Response** (200 OK):

```json
{
    "data": {
        "form": {
            "_id": "form123",
            "userId": "user456",
            "title": "Customer Feedback Survey",
            "description": "Help us improve our services",
            "isPrivate": false,
            "isPublished": true,
            "settings": {
                /* settings object */
            },
            "createdAt": "2026-05-29T10:00:00Z",
            "updatedAt": "2026-05-29T10:00:00Z"
        },
        "sections": [
            /* array of sections */
        ],
        "questions": [
            /* array of questions */
        ]
    },
    "message": "Form retrieved successfully"
}
```

---

## Update Form

**Endpoint**: `PATCH /api/forms/:formId`  
**Authentication**: Required  
**Description**: Updates form metadata and settings

**Request Body**:

```json
{
    "data": {
        "title": "Updated Form Title",
        "isPublished": true,
        "settings": {
            "progressBar": true,
            "collectEmail": true
        }
    }
}
```

**Response** (200 OK): Returns updated form object

---

## List User Forms

**Endpoint**: `GET /api/forms`  
**Authentication**: Required  
**Description**: Lists all forms created by authenticated user

**Query Parameters**:

- `page`: Page number (default: 1)
- `limit`: Items per page (default: 10)

**Response** (200 OK):

```json
{
    "data": [
        {
            "_id": "form123",
            "title": "Customer Feedback Survey",
            "isPublished": true,
            "createdAt": "2026-05-29T10:00:00Z",
            "updatedAt": "2026-05-29T10:00:00Z"
        }
    ],
    "pagination": {
        "total": 25,
        "page": 1,
        "limit": 10,
        "pages": 3
    },
    "message": "Forms retrieved successfully"
}
```

---

## Delete Form

**Endpoint**: `DELETE /api/forms/:formId`  
**Authentication**: Required  
**Description**: Deletes a form and all associated sections, questions, and responses

**Response** (200 OK):

```json
{
    "message": "Form deleted successfully"
}
```

---

## Error Responses

**400 Bad Request**: Missing or invalid required fields

```json
{
    "status": 400,
    "message": "Validation failed",
    "errors": [
        {
            "field": "title",
            "message": "Title is required"
        }
    ]
}
```

**401 Unauthorized**: Missing authentication token

```json
{
    "status": 401,
    "message": "Authentication required"
}
```

**404 Not Found**: Form doesn't exist

```json
{
    "status": 404,
    "message": "Form not found"
}
```

**422 Unprocessable Entity**: Constraint violation (e.g., allowedDomains without isPrivate)

```json
{
    "status": 422,
    "message": "allowedDomains can only be set when isPrivate is true"
}
```

---

## Next Steps

1. [Create Sections](FORMS.SECTIONS.MD)
2. [Add Questions](FORMS.QUESTIONS.MD)
3. [Handle Submissions](FORM.FIll.MD)
   "allowedDomains": [
   "company.com",
   "partner.org"
   ],
   "settings": {
   "maxResponses": 500,
   "maxResponsesPerUser": 1,
   "closeDate": "2026-12-31T23:59:59.000Z",
   "startDate": "2026-06-01T09:00:00.000Z",
   "timeLimitPerResponse": 1800,
   "collectEmail": true,
   "shuffleQuestions": true,
   "allowEditResponse": false,
   "saveAndContinueLater": true,
   "progressBar": true,
   "customConfirmationMessage": "Thank you for your feedback! The leadership team will review your inputs shortly.",
   "redirectUrl": "https://intranet.company.com/success"
   },
   "\_id": "6a18cd6d1f892e03d087047f",
   "createdAt": "2026-05-28T23:19:09.675Z",
   "updatedAt": "2026-05-28T23:19:09.675Z"
   }
   }
   }

````

## Retrieving Forms

- endpoint: `{{BASE_URL}}/forms`
- method: `GET`
- Authentication: Required

```JSON
{
    "success": true,
    "message": "Forms retrieved successfully",
    "data": {
        "forms": [
            {
                "_id": "6a18cd6d1f892e03d087047f",
                "userId": "6a18ccf11f892e03d087047d",
                "title": "Q3 Engineering Performance Feedback",
                "description": "Please provide your insights on the recent sprint deliverables and team collaboration.",
                "isPrivate": true,
                "isPublished": false,
                "allowedDomains": [
                    "company.com",
                    "partner.org"
                ],
                "settings": {
                    "maxResponses": 500,
                    "maxResponsesPerUser": 1,
                    "closeDate": "2026-12-31T23:59:59.000Z",
                    "startDate": "2026-06-01T09:00:00.000Z",
                    "timeLimitPerResponse": 1800,
                    "collectEmail": true,
                    "shuffleQuestions": true,
                    "allowEditResponse": false,
                    "saveAndContinueLater": true,
                    "progressBar": true,
                    "customConfirmationMessage": "Thank you for your feedback! The leadership team will review your inputs shortly.",
                    "redirectUrl": "https://intranet.company.com/success"
                },
                "createdAt": "2026-05-28T23:19:09.675Z",
                "updatedAt": "2026-05-28T23:19:09.675Z"
            }
        ]
    }
}
````

## Retrieving a Single Form

- endpoint: `{{BASE_URL}}/forms/:formId`
- method: `GET`
- Authentication: Required

- Response:

```JSON
{
    "success": true,
    "message": "Form retrieved successfully",
    "data": {
        "form": {
            "_id": "6a18cd6d1f892e03d087047f",
            "userId": "6a18ccf11f892e03d087047d",
            "title": "Q3 Engineering Performance Feedback",
            "description": "Please provide your insights on the recent sprint deliverables and team collaboration.",
            "isPrivate": true,
            "isPublished": false,
            "allowedDomains": [
                "company.com",
                "partner.org"
            ],
            "settings": {
                "maxResponses": 500,
                "maxResponsesPerUser": 1,
                "closeDate": "2026-12-31T23:59:59.000Z",
                "startDate": "2026-06-01T09:00:00.000Z",
                "timeLimitPerResponse": 1800,
                "collectEmail": true,
                "shuffleQuestions": true,
                "allowEditResponse": false,
                "saveAndContinueLater": true,
                "progressBar": true,
                "customConfirmationMessage": "Thank you for your feedback! The leadership team will review your inputs shortly.",
                "redirectUrl": "https://intranet.company.com/success"
            },
            "createdAt": "2026-05-28T23:19:09.675Z",
            "updatedAt": "2026-05-28T23:19:09.675Z"
        }
    }
}
```

## Updating a Form

- endpoint: `{{BASE_URL}}/forms/:formId`
- method: `PUT`
- Authentication: Required

- Request Body:

```JSON
{
  "data": {
    "title": "Full Overwrite: Q4 Strategy Planning",
    "description": "This is a full replacement of the previous form configuration.",
    "isPrivate": false,
    "isPublished": true,
    "allowedDomains": [],
    "settings": {
      "maxResponses": 100,
      "maxResponsesPerUser": 1,
      "closeDate": null,
      "startDate": null,
      "timeLimitPerResponse": null,
      "collectEmail": false,
      "shuffleQuestions": false,
      "allowEditResponse": false,
      "saveAndContinueLater": false,
      "progressBar": false,
      "customConfirmationMessage": "Updated successfully.",
      "redirectUrl": null
    }
  }
}
```

- Response:

```JSON
{
    "success": true,
    "message": "Form updated successfully",
    "data": {
        "form": {
            "userId": "6a18ccf11f892e03d087047d",
            "title": "Full Overwrite: Q4 Strategy Planning",
            "description": "This is a full replacement of the previous form configuration.",
            "isPrivate": false,
            "isPublished": true,
            "allowedDomains": [],
            "settings": {
                "maxResponses": 100,
                "maxResponsesPerUser": 1,
                "closeDate": null,
                "startDate": null,
                "timeLimitPerResponse": null,
                "collectEmail": false,
                "shuffleQuestions": false,
                "allowEditResponse": false,
                "saveAndContinueLater": false,
                "progressBar": false,
                "customConfirmationMessage": "Updated successfully.",
                "redirectUrl": null
            },
            "_id": "6a18cd6d1f892e03d087047f",
            "createdAt": "2026-05-28T23:19:09.675Z",
            "updatedAt": "2026-05-28T23:25:40.359Z"
        }
    }
}
```

## Partially Updating a Form

- endpoint: `{{BASE_URL}}/forms/:formId`
- method: `PATCH`
- Authentication: Required
- Request Body:

```JSON
{
  "data": {
    "isPrivate": true

  }
}
```

- Response:

```JSON
{
    "success": true,
    "message": "Form updated successfully",
    "data": {
        "form": {
            "userId": "6a18ccf11f892e03d087047d",
            "title": "Full Overwrite: Q4 Strategy Planning",
            "description": "This is a full replacement of the previous form configuration.",
            "isPrivate": true,
            "isPublished": true,
            "allowedDomains": [],
            "settings": {
                "maxResponses": 100,
                "maxResponsesPerUser": 1,
                "closeDate": null,
                "startDate": null,
                "timeLimitPerResponse": null,
                "collectEmail": false,
                "shuffleQuestions": false,
                "allowEditResponse": false,
                "saveAndContinueLater": false,
                "progressBar": false,
                "customConfirmationMessage": "Updated successfully.",
                "redirectUrl": null
            },
            "_id": "6a18cd6d1f892e03d087047f",
            "createdAt": "2026-05-28T23:19:09.675Z",
            "updatedAt": "2026-05-28T23:31:05.479Z"
        }
    }
}
```

## deleting a Form

- endpoint: `{{BASE_URL}}/forms/:formId`
- method: `DELETE`
- Authentication: Required
- Response: 204 No Content

## Publishing a Form

- endpoint: `{{BASE_URL}}/forms/:formId/publish`
- method: `POST`
- Authentication: Required
- Response:

```JSON
{
    "success": true,
    "message": "Form published successfully",
    "data": {
        "form": {
            "_id": "6a18d0f3b1fd67d49b00ce6b",
            "userId": "6a18ccf11f892e03d087047d",
            "title": "Full Overwrite: Q4 Strategy Planning",
            "description": "This is a full replacement of the previous form configuration.",
            "isPrivate": true,
            "isPublished": true,
            "allowedDomains": [],
            "settings": {
                "maxResponses": 100,
                "maxResponsesPerUser": 1,
                "closeDate": null,
                "startDate": null,
                "timeLimitPerResponse": null,
                "collectEmail": false,
                "shuffleQuestions": false,
                "allowEditResponse": false,
                "saveAndContinueLater": false,
                "progressBar": false,
                "customConfirmationMessage": "Updated successfully.",
                "redirectUrl": null
            },
            "createdAt": "2026-05-28T23:34:11.964Z",
            "updatedAt": "2026-05-28T23:36:00.750Z"
        }
    }
}
```

## Unpublishing a Form

- endpoint: `{{BASE_URL}}/forms/:formId/unpublish`
- method: `POST`
- Authentication: Required
- Response:

```JSON
{
    "success": true,
    "message": "Form unpublished successfully",
    "data": {
        "form": {
            "_id": "6a18d0f3b1fd67d49b00ce6b",
            "userId": "6a18ccf11f892e03d087047d",
            "title": "Full Overwrite: Q4 Strategy Planning",
            "description": "This is a full replacement of the previous form configuration.",
            "isPrivate": true,
            "isPublished": false,
            "allowedDomains": [],
            "settings": {
                "maxResponses": 100,
                "maxResponsesPerUser": 1,
                "closeDate": null,
                "startDate": null,
                "timeLimitPerResponse": null,
                "collectEmail": false,
                "shuffleQuestions": false,
                "allowEditResponse": false,
                "saveAndContinueLater": false,
                "progressBar": false,
                "customConfirmationMessage": "Updated successfully.",
                "redirectUrl": null
            },
            "createdAt": "2026-05-28T23:34:11.964Z",
            "updatedAt": "2026-05-28T23:36:37.252Z"
        }
    }
}
```
