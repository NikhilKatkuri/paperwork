# Questions API Documentation

Guide for creating and managing form questions. Questions are the individual fields within sections.  
See [SCHEMA.README.MD](SCHEMA.README.MD) for detailed question schema and validation rules.

---

## Create Question

**Endpoint**: `POST /api/forms/:formId/sections/:sectionId/questions`  
**Authentication**: Required  
**Description**: Creates a new question within a section

### Text Question Example

**Request Body**:

```json
{
    "data": {
        "type": "TEXT",
        "question": "What is your full name?",
        "helpText": "Please provide your legal name",
        "placeholder": "e.g., John Doe",
        "isRequired": true
    }
}
```

**Response** (201 Created):

```json
{
    "data": {
        "question": {
            "_id": "q_123",
            "formId": "form456",
            "sectionId": "section789",
            "index": 0,
            "type": "TEXT",
            "question": "What is your full name?",
            "helpText": "Please provide your legal name",
            "placeholder": "e.g., John Doe",
            "isRequired": true,
            "createdAt": "2026-05-29T10:00:00Z",
            "updatedAt": "2026-05-29T10:00:00Z"
        }
    },
    "message": "Question created successfully"
}
```

---

## Question Type Examples

### Radio/Single Choice

```json
{
    "data": {
        "type": "RADIO",
        "question": "What is your experience level?",
        "isRequired": true,
        "options": [
            { "index": 0, "value": "beginner", "label": "Beginner" },
            { "index": 1, "value": "intermediate", "label": "Intermediate" },
            { "index": 2, "value": "expert", "label": "Expert" }
        ]
    }
}
```

### Checkbox/Multiple Choice

```json
{
    "data": {
        "type": "CHOICE",
        "question": "Which platforms do you use?",
        "isRequired": true,
        "options": [
            { "index": 0, "value": "web", "label": "Web" },
            { "index": 1, "value": "mobile", "label": "Mobile App" },
            { "index": 2, "value": "desktop", "label": "Desktop App" }
        ],
        "validationRule": {
            "ruleType": "CHECKBOX_MIN_SELECT",
            "min": 1,
            "customErrorMessage": "Please select at least one platform"
        }
    }
}
```

### Dropdown

```json
{
    "data": {
        "type": "DROP_DOWN",
        "question": "Select your country",
        "isRequired": true,
        "options": [
            { "index": 0, "value": "us", "label": "United States" },
            { "index": 1, "value": "ca", "label": "Canada" },
            { "index": 2, "value": "mx", "label": "Mexico" }
        ]
    }
}
```

### Rating Scale

```json
{
    "data": {
        "type": "RATING",
        "question": "How satisfied are you with our service?",
        "isRequired": true,
        "ratingConfig": {
            "icon": "STAR",
            "scale": 5,
            "lowLabel": "Very Unsatisfied",
            "highLabel": "Very Satisfied"
        }
    }
}
```

### Linear Scale

```json
{
    "data": {
        "type": "LINEAR_SCALE",
        "question": "To what extent do you agree?",
        "isRequired": true,
        "ratingConfig": {
            "icon": "THUMB_UP",
            "scale": 10,
            "lowLabel": "Strongly Disagree",
            "highLabel": "Strongly Agree"
        }
    }
}
```

### Date

```json
{
    "data": {
        "type": "DATE",
        "question": "When did you start?",
        "isRequired": true,
        "validationRule": {
            "ruleType": "DATE_IS_AFTER",
            "value": "2020-01-01",
            "customErrorMessage": "Must be after January 1, 2020"
        }
    }
}
```

### Time

```json
{
    "data": {
        "type": "TIME",
        "question": "What time do you prefer?",
        "isRequired": false
    }
}
```

### Paragraph/Long Text

```json
{
    "data": {
        "type": "PARAGRAPH",
        "question": "Please share your feedback",
        "helpText": "Be as detailed as possible",
        "placeholder": "Your feedback here...",
        "isRequired": false,
        "validationRule": {
            "ruleType": "MAX_CHAR_COUNT",
            "max": 500,
            "customErrorMessage": "Feedback must be 500 characters or less"
        }
    }
}
```

---

## Conditional Questions

Display a question only if a previous question has a specific answer:

```json
{
    "data": {
        "type": "TEXT",
        "question": "Please specify your other experience",
        "dependsOn": {
            "questionId": "q_experience123",
            "value": "other"
        }
    }
}
```

---

## Validation Rules

### Email Validation

```json
{
    "validationRule": {
        "ruleType": "EMAIL",
        "customErrorMessage": "Please enter a valid email address"
    }
}
```

### Character Count

```json
{
    "validationRule": {
        "ruleType": "MIN_CHAR_COUNT",
        "min": 10,
        "customErrorMessage": "Minimum 10 characters required"
    }
}
```

### Number Range

```json
{
    "validationRule": {
        "ruleType": "NUMBER_BETWEEN",
        "min": 1,
        "max": 100,
        "customErrorMessage": "Must be between 1 and 100"
    }
}
```

### Regex Pattern

```json
{
    "validationRule": {
        "ruleType": "REGEX_MATCH",
        "pattern": "^[A-Z0-9]{4,6}$",
        "customErrorMessage": "Must be 4-6 uppercase letters or numbers"
    }
}
```

### URL Validation

```json
{
    "validationRule": {
        "ruleType": "URL",
        "customErrorMessage": "Please enter a valid URL"
    }
}
```

---

## Retrieve Questions

**Endpoint**: `GET /api/forms/:formId/sections/:sectionId/questions`  
**Authentication**: Required

**Response** (200 OK):

```json
{
    "data": [
        {
            "_id": "q_123",
            "type": "TEXT",
            "question": "What is your full name?",
            "isRequired": true
        }
    ],
    "message": "Questions retrieved successfully"
}
```

---

## Update Question

**Endpoint**: `PATCH /api/forms/:formId/questions/:questionId`  
**Authentication**: Required

**Request Body**: Send any fields to update

```json
{
    "data": {
        "question": "Updated question text",
        "isRequired": false,
        "helpText": "Updated help text"
    }
}
```

---

## Delete Question

**Endpoint**: `DELETE /api/forms/:formId/questions/:questionId`  
**Authentication**: Required

**Response** (200 OK):

```json
{
    "message": "Question deleted successfully"
}
```

---

## Question Type Reference

| Type         | Input Format       | Config                       | Best For                       |
| ------------ | ------------------ | ---------------------------- | ------------------------------ |
| TEXT         | Single line text   | placeholder                  | Names, emails, short answers   |
| PARAGRAPH    | Multi-line text    | placeholder, validation      | Feedback, essays, descriptions |
| RADIO        | Single selection   | options                      | Yes/No, preference             |
| CHOICE       | Multiple selection | options, validation          | Interests, skills              |
| DROP_DOWN    | Dropdown list      | options                      | Countries, categories          |
| RATING       | Star/icon rating   | ratingConfig (5 or 10 stars) | Satisfaction, quality          |
| LINEAR_SCALE | Numeric scale      | ratingConfig (1-10)          | Agreement, importance          |
| DATE         | Date picker        | validation                   | Birthdate, events              |
| TIME         | Time picker        | validation                   | Preferences, schedules         |

---

## Next Steps

- [Submit Form Responses](FORM.FIll.MD)
- [Back to Forms](FORMS.README.MD)
- Authentication: Required
- Response body:

```JSON
{
    "success": true,
    "message": "Questions retrieved successfully",
    "data": {
        "questions": [
            {
                "_id": "6a18d369b1fd67d49b00ce6d",
                "formId": "6a18d0f3b1fd67d49b00ce6b",
                "sectionId": "6a18d215b1fd67d49b00ce6c",
                "index": 0,
                "type": "TEXT",
                "question": "What is your full name?",
                "helpText": "Please provide your legal name as per ID.",
                "placeholder": "e.g. John Doe",
                "isRequired": true,
                "createdAt": "2026-05-28T23:44:41.164Z",
                "updatedAt": "2026-05-28T23:44:41.164Z"
            }
        ]
    }
}
```

## Retrieve question by questionId

- endpoint: `/forms/{formId}/sections/{sectionId}/questions/{questionId}`
- method: `GET`
- Authentication: Required
- Response body:

```JSON
{
    "success": true,
    "message": "Question retrieved successfully",
    "data": {
        "question": {
            "_id": "6a18d369b1fd67d49b00ce6d",
            "formId": "6a18d0f3b1fd67d49b00ce6b",
            "sectionId": "6a18d215b1fd67d49b00ce6c",
            "index": 0,
            "type": "TEXT",
            "question": "What is your full name?",
            "helpText": "Please provide your legal name as per ID.",
            "placeholder": "e.g. John Doe",
            "isRequired": true,
            "createdAt": "2026-05-28T23:44:41.164Z",
            "updatedAt": "2026-05-28T23:44:41.164Z"
        }
    }
}
```

## Delete question by questionId

- endpoint: `/forms/{formId}/sections/{sectionId}/questions/{questionId}`
- method: `DELETE`
- Authentication: Required
- Response : 204 No Content

## reoder questions

- endpoint: `/forms/{formId}/sections/{sectionId}/questions/reorder`
- method: `POST`
- Authentication: Required

- Request body:

```JSON
{
    "data": [
        {
            "questionId":  "6a18d4b8b1fd67d49b00ce6f",
            "index": 0
        },
        {
            "questionId": "6a18d369b1fd67d49b00ce6d",
            "index": 1
        }
    ]
}
```

- Response body:

```JSON
{
    "success": true,
    "message": "Questions reordered successfully",
    "data": {
        "questions": [
            {
                "_id": "6a18d4b8b1fd67d49b00ce6f",
                "formId": "6a18d0f3b1fd67d49b00ce6b",
                "sectionId": "6a18d215b1fd67d49b00ce6c",
                "index": 0,
                "type": "RATING",
                "question": "How satisfied are you with our service?",
                "helpText": "",
                "ratingConfig": {
                    "icon": "STAR",
                    "scale": 5,
                    "lowLabel": "Very Dissatisfied",
                    "highLabel": "Extremely Satisfied"
                },
                "validationRule": {
                    "ruleType": "NUMBER_GREATER_THAN",
                    "value": 1,
                    "customErrorMessage": "Please select a rating of at least 1 star."
                },
                "placeholder": "",
                "isRequired": true,
                "createdAt": "2026-05-28T23:50:16.230Z",
                "updatedAt": "2026-05-28T23:57:06.685Z"
            },
            {
                "_id": "6a18d369b1fd67d49b00ce6d",
                "formId": "6a18d0f3b1fd67d49b00ce6b",
                "sectionId": "6a18d215b1fd67d49b00ce6c",
                "index": 1,
                "type": "TEXT",
                "question": "What is your full name?",
                "helpText": "Please provide your legal name as per ID.",
                "placeholder": "e.g. John Doe",
                "isRequired": true,
                "createdAt": "2026-05-28T23:44:41.164Z",
                "updatedAt": "2026-05-28T23:57:06.685Z"
            }
        ]
    }
}
```

## Update question by questionId

- endpoint: `/forms/{formId}/sections/{sectionId}/questions/{questionId}`
- method: `PUT`
- Authentication: Required
- Request body:

```JSON
{
    "data": {
        "type": "RATING",
        "question": "How satisfied are you with our service?",
        "helpText": "",
        "ratingConfig": {
            "icon": "STAR",
            "scale": 5,
            "lowLabel": "Very Dissatisfied",
            "highLabel": "Extremely Satisfied"
        },
        "validationRule": {
            "ruleType": "NUMBER_GREATER_THAN",
            "value": 1,
            "customErrorMessage": "Please select a rating of at least 1 star."
        },
        "placeholder": "choose gracefully"
    }
}
```

- Response body:

```JSON
{
    "success": true,
    "message": "Question updated successfully",
    "data": {
        "question": {
            "_id": "6a18d4b8b1fd67d49b00ce6f",
            "formId": "6a18d0f3b1fd67d49b00ce6b",
            "sectionId": "6a18d215b1fd67d49b00ce6c",
            "index": 0,
            "type": "RATING",
            "question": "How satisfied are you with our service?",
            "helpText": "",
            "ratingConfig": {
                "icon": "STAR",
                "scale": 5,
                "lowLabel": "Very Dissatisfied",
                "highLabel": "Extremely Satisfied"
            },
            "validationRule": {
                "ruleType": "NUMBER_GREATER_THAN",
                "value": 1,
                "customErrorMessage": "Please select a rating of at least 1 star."
            },
            "placeholder": "choose gracefully",
            "isRequired": false,
            "createdAt": "2026-05-28T23:50:16.230Z",
            "updatedAt": "2026-05-29T00:00:12.264Z"
        }
    }
}
```

## Bulk Question Creation

- endpoint: `/forms/{formId}/sections/{sectionId}/questions/bulk`
- method: `POST`
- Authentication: Required
- Request body:

```JSON
{
    "data": [
        {
            "type": "TEXT",
            "question": "What is your full name?",
            "helpText": "Please provide your legal name as per ID.",
            "placeholder": "e.g. John Doe",
            "isRequired": true
        },
        {
            "type": "RATING",
            "question": "How satisfied are you with our service?",
            "helpText": "",
            "ratingConfig": {
                "icon": "STAR",
                "scale": 5,
                "lowLabel": "Very Dissatisfied",
                "highLabel": "Extremely Satisfied"
            },
            "validationRule": {
                "ruleType": "NUMBER_GREATER_THAN",
                "value": 1,
                "customErrorMessage": "Please select a rating of at least 1 star."
            },
            "placeholder": "",
            "isRequired": true
        }
    ]
}
```

- Response body:

```JSON
{
    "success": true,
    "data": [
        {
            "_id": "q_123",
            "formId": "form456",
            "sectionId": "section789",
            "index": 0,
            "type": "TEXT",
            "question": "What is your full name?",
            "helpText": "Please provide your legal name as per ID.",
            "placeholder": "e.g. John Doe",
            "isRequired": true,
            "createdAt": "2026-05-29T10:00:00Z",
            "updatedAt": "2026-05-29T10:00:00Z"
        },
        {
            "_id": "q_124",
            "formId": "form456",
            "sectionId": "section789",
            "index": 1,
            "type": "RATING",
            "question": "How satisfied are you with our service?",
            "helpText": "",
            "ratingConfig": {
                "icon": "STAR",
                "scale": 5,
                "lowLabel": "Very Dissatisfied",
                "highLabel": "Extremely Satisfied"
            },
            "validationRule": {
                "ruleType": "NUMBER_GREATER_THAN",
                "value": 1,
                "customErrorMessage": "Please select a rating of at least 1 star."
            },
            "placeholder": "",
            "isRequired": true,
            "createdAt": "2026-05-29T10:00:00Z",
            "updatedAt": "2026-05-29T10:00:00Z"
        }
    ],
    "message": "Questions created successfully"

}

```
