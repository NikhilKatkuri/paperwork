# Sections API Documentation

Guide for creating and managing form sections. Sections group questions together and control form flow.  
See [SCHEMA.README.MD](SCHEMA.README.MD) for detailed section schema.

---

## Create Section

**Endpoint**: `POST /api/forms/:formId/sections`  
**Authentication**: Required  
**Description**: Creates a new section within a form

**Request Body**:

```json
{
    "data": {
        "index": 0,
        "title": "Personal Information",
        "description": "Please provide your basic details",
        "defaultAction": {
            "actionType": "NEXT_SECTION"
        }
    }
}
```

**Response** (201 Created):

```json
{
    "data": {
        "section": {
            "_id": "section123",
            "formId": "form456",
            "index": 0,
            "title": "Personal Information",
            "description": "Please provide your basic details",
            "defaultAction": {
                "actionType": "NEXT_SECTION"
            },
            "onAnswer": [],
            "createdAt": "2026-05-29T10:00:00Z",
            "updatedAt": "2026-05-29T10:00:00Z"
        }
    },
    "message": "Section created successfully"
}
```

---

## Create Section with Conditional Flow

**Request Body** (Example: Branch based on age):

```json
{
    "data": {
        "index": 0,
        "title": "Age Verification",
        "description": "Tell us your age",
        "onAnswer": [
            {
                "questionId": "q_age123",
                "value": "18+",
                "action": {
                    "actionType": "NEXT_SECTION"
                }
            },
            {
                "questionId": "q_age123",
                "value": "<18",
                "action": {
                    "actionType": "GO_TO_SECTION",
                    "sectionId": "section_parental_consent"
                }
            }
        ]
    }
}
```

---

## Retrieve Sections

**Endpoint**: `GET /api/forms/:formId/sections`  
**Authentication**: Required  
**Description**: Gets all sections for a form

**Response** (200 OK):

```json
{
    "data": [
        {
            "_id": "section123",
            "formId": "form456",
            "index": 0,
            "title": "Personal Information",
            "description": "Please provide your basic details",
            "onAnswer": [],
            "defaultAction": { "actionType": "NEXT_SECTION" },
            "createdAt": "2026-05-29T10:00:00Z"
        },
        {
            "_id": "section124",
            "formId": "form456",
            "index": 1,
            "title": "Feedback",
            "description": "Share your thoughts",
            "onAnswer": [],
            "createdAt": "2026-05-29T10:05:00Z"
        }
    ],
    "message": "Sections retrieved successfully"
}
```

---

## Update Section

**Endpoint**: `PATCH /api/forms/:formId/sections/:sectionId`  
**Authentication**: Required  
**Description**: Updates section metadata and flow rules

**Request Body**:

```json
{
    "data": {
        "title": "Updated Section Title",
        "description": "Updated description",
        "defaultAction": {
            "actionType": "NEXT_SECTION"
        },
        "onAnswer": [
            {
                "questionId": "q_type123",
                "value": "skip",
                "action": {
                    "actionType": "SUBMIT_FORM"
                }
            }
        ]
    }
}
```

---

## Reorder Sections

**Endpoint**: `PATCH /api/forms/:formId/sections/reorder`  
**Authentication**: Required  
**Description**: Reorders all sections in a form

**Request Body**:

```json
{
    "data": {
        "sections": [
            { "id": "section124", "index": 0 },
            { "id": "section123", "index": 1 }
        ]
    }
}
```

**Response** (200 OK):

```json
{
    "data": [
        {
            "_id": "section124",
            "index": 0,
            "title": "Feedback"
        },
        {
            "_id": "section123",
            "index": 1,
            "title": "Personal Information"
        }
    ],
    "message": "Sections reordered successfully"
}
```

---

## Delete Section

**Endpoint**: `DELETE /api/forms/:formId/sections/:sectionId`  
**Authentication**: Required  
**Description**: Deletes a section and all its questions

**Response** (200 OK):

```json
{
    "message": "Section deleted successfully"
}
```

---

## Flow Control Types

| Action Type     | Use Case                       | Requires sectionId |
| --------------- | ------------------------------ | ------------------ |
| `NEXT_SECTION`  | Go to next section in sequence | No                 |
| `GO_TO_SECTION` | Jump to specific section       | Yes                |
| `SUBMIT_FORM`   | End form immediately           | No                 |

---

## Example: Multi-Step Form with Branching

```json
Section 0: Screening
  onAnswer: [
    - if answer="qualified" → NEXT_SECTION (go to Section 1)
    - if answer="not_qualified" → SUBMIT_FORM (end form)
  ]

Section 1: Main Form
  onAnswer: [
    - if answer="need_help" → GO_TO_SECTION (jump to Section 3)
  ]
  defaultAction: NEXT_SECTION

Section 2: Confirmation
  defaultAction: SUBMIT_FORM

Section 3: Help Resources
  defaultAction: NEXT_SECTION (go to Section 2)
```

---

## Next Steps

- [Add Questions to Sections](FORMS.QUESTIONS.MD)
- [Submit Form Responses](FORM.FIll.MD)

- Response body:

```json
{
    "success": true,
    "message": "Sections retrieved successfully",
    "data": {
        "sections": [
            {
                "_id": "6a18d215b1fd67d49b00ce6c",
                "formId": "6a18d0f3b1fd67d49b00ce6b",
                "index": 0,
                "title": "Introduction",
                "description": "Please fill out your personal information first.",
                "defaultAction": {
                    "actionType": "NEXT_SECTION"
                },
                "onAnswer": [],
                "createdAt": "2026-05-28T23:39:01.558Z",
                "updatedAt": "2026-05-28T23:39:01.558Z"
            }
        ]
    }
}
```

## Retrieve section by sectionId

- endpoint: `/forms/{formId}/sections/{sectionId}`
- method: `GET`

- Response body:

```json
{
    "success": true,
    "message": "Section retrieved successfully",
    "data": {
        "section": {
            "_id": "6a18d215b1fd67d49b00ce6c",
            "formId": "6a18d0f3b1fd67d49b00ce6b",
            "index": 0,
            "title": "Introduction",
            "description": "Please fill out your personal information first.",
            "defaultAction": {
                "actionType": "NEXT_SECTION"
            },
            "onAnswer": [],
            "createdAt": "2026-05-28T23:39:01.558Z",
            "updatedAt": "2026-05-28T23:39:01.558Z"
        }
    }
}
```

## Retrieve section by sectionId

- endpoint: `/forms/{formId}/sections/{sectionId}`
- method: `GET`

- Response body:

```json
{
    "success": true,
    "message": "Section retrieved successfully",
    "data": {
        "section": {
            "_id": "6a18d215b1fd67d49b00ce6c",
            "formId": "6a18d0f3b1fd67d49b00ce6b",
            "index": 0,
            "title": "Introduction",
            "description": "Please fill out your personal information first.",
            "defaultAction": {
                "actionType": "NEXT_SECTION"
            },
            "onAnswer": [],
            "createdAt": "2026-05-28T23:39:01.558Z",
            "updatedAt": "2026-05-28T23:39:01.558Z"
        }
    }
}
```
