# Core Schema Documentation

This document explains the form schema structure and when to use each schema component.

---

## 1. Form Schema (`schemas.forms.ts`)

**Purpose**: Defines the root form structure and global settings.

**When to Use**:

- Creating a new form
- Updating form metadata (title, description, privacy settings)
- Configuring global form settings (deadlines, response limits, etc.)

**Input/Output Structure**:

```typescript
{
  // Required Fields
  title: string,                    // Form title (displayed to users)
  description: string,              // Form description

  // Form Visibility & Access
  isPrivate: boolean,               // Default: false - private forms only visible to owner
  isPublished: boolean,             // Default: false - must be true for public responses
  allowedDomains?: string[],        // Only used if isPrivate=true. Restrict embedding to specific domains

  // Global Settings (optional)
  settings: {
    // Response Limits
    maxResponses?: number,           // Total response limit for the form
    maxResponsesPerUser?: number,    // Responses per individual user

    // Timing Controls
    startDate?: Date,                // When form becomes available
    closeDate?: Date,                // When form closes (no more responses)
    timeLimitPerResponse?: number,   // Seconds allowed per response session

    // Response Collection
    collectEmail: boolean,           // Default: false - collect responder email

    // User Experience
    shuffleQuestions: boolean,       // Default: false - randomize question order
    allowEditResponse: boolean,      // Default: false - allow users to edit submitted responses
    saveAndContinueLater: boolean,  // Default: false - allow resuming incomplete responses
    progressBar: boolean,            // Default: false - show progress indicator

    // Completion
    customConfirmationMessage?: string, // Custom message after form submission
    redirectUrl?: string            // Redirect user after submission
  }
}
```

**Key Constraints**:

- `allowedDomains` can ONLY be set when `isPrivate=true`
- Form must be published (`isPublished=true`) to receive responses

---

## 2. Section Schema (`schemas.sections.ts`)

**Purpose**: Groups related questions together and controls form flow/navigation.

**When to Use**:

- Creating logical sections/pages within a form
- Defining conditional branching (show different sections based on answers)
- Organizing long forms into multiple pages

**Input/Output Structure**:

```typescript
{
  // Identifiers (auto-generated, read-only)
  formId: string,                   // Parent form ID

  // Display
  index: number,                    // Section order in form (0-based)
  title: string,                    // Section title
  description?: string,             // Optional section instructions

  // Flow Control
  onAnswer?: Array<{
    questionId: string,             // Which question triggers this rule
    value: string,                  // What answer value triggers this rule
    action: {
      actionType: 'NEXT_SECTION' | 'GO_TO_SECTION' | 'SUBMIT_FORM',
      // NEXT_SECTION: Go to next section in sequence
      // GO_TO_SECTION: Jump to specific section (requires sectionId)
      // SUBMIT_FORM: Complete form immediately

      sectionId?: string            // Required if actionType='GO_TO_SECTION'
    }
  }>,

  defaultAction?: {                 // Action if no onAnswer rules match
    actionType: 'NEXT_SECTION' | 'GO_TO_SECTION' | 'SUBMIT_FORM',
    sectionId?: string
  }
}
```

**Flow Example**:

```
Section 1 (index: 0)
  - Question: "What is your age?"
  - Answer "18+" → onAnswer action: NEXT_SECTION (go to Section 2)
  - Answer "<18" → onAnswer action: GO_TO_SECTION (sectionId: "parentConsent")

Section 2 (index: 1)
  - Questions for adults...

Section parentConsent (index: 2)
  - Questions requiring parental consent...
```

---

## 3. Question Schema (`schemas.questions.ts`)

**Purpose**: Defines individual form fields with types, validation, and conditional logic.

**When to Use**:

- Adding questions to a section
- Configuring validation rules
- Setting up conditional questions (show/hide based on previous answers)
- Creating questions with options (radio, dropdown, checkboxes)

**Input/Output Structure**:

```typescript
{
  // Identifiers (auto-generated, read-only)
  formId: string,                   // Parent form ID
  sectionId: string,                // Parent section ID
  index: number,                    // Question order in section (0-based)

  // Question Content
  type: 'TEXT' | 'PARAGRAPH' | 'CHOICE' | 'RADIO' | 'DROP_DOWN' |
        'LINEAR_SCALE' | 'RATING' | 'DATE' | 'TIME',
  question: string,                 // Question text (required)
  helpText?: string,                // Hint/instructions (max 500 chars)
  placeholder?: string,             // Input placeholder (max 100 chars)
  isRequired: boolean,              // Default: false

  // Options (for CHOICE, RADIO, DROP_DOWN)
  options?: Array<{
    index: number,                  // Option order
    value: string,                  // Internal value (sent in response)
    label: string,                  // Display text (max 100 chars)
  }>,

  // Conditional Logic
  dependsOn?: {
    questionId: string,             // Show this question only if...
    value: string                   // ...previous question has this answer
  },

  // Rating-Specific Config (for RATING type only)
  ratingConfig?: {
    icon: 'STAR' | 'HEART' | 'THUMB_UP',
    scale: 5 | 10,                  // Rating scale (5 or 10 points)
    lowLabel?: string,              // Left/bottom label (max 50 chars)
    highLabel?: string              // Right/top label (max 50 chars)
  },

  // Validation Rules
  validationRule?: {
    ruleType: 'EMAIL' | 'URL' | 'NUMBER_GREATER_THAN' | 'NUMBER_LESS_THAN' |
              'REGEX_MATCH' | 'MAX_CHAR_COUNT' | 'NUMBER_EQUAL_TO' | 'NUMBER_BETWEEN' |
              'MIN_CHAR_COUNT' | 'DATE_IS_BEFORE' | 'DATE_IS_AFTER' |
              'CHECKBOX_MIN_SELECT' | 'CHECKBOX_MAX_SELECT',
    value?: number | string,        // For EQUAL_TO, GREATER_THAN, LESS_THAN
    min?: number,                   // For BETWEEN, MIN_CHAR_COUNT, MIN_SELECT
    max?: number,                   // For BETWEEN, MAX_CHAR_COUNT, MAX_SELECT
    pattern?: string,               // For REGEX_MATCH (max 200 chars)
    customErrorMessage?: string     // Custom validation error (max 200 chars)
  }
}
```

**Question Type Guide**:

| Type         | Use Case                   | Requires Options | Config                  |
| ------------ | -------------------------- | ---------------- | ----------------------- |
| TEXT         | Short answer               | No               | Optional placeholder    |
| PARAGRAPH    | Long answer                | No               | Optional placeholder    |
| CHOICE       | Multiple selection         | Yes              | None                    |
| RADIO        | Single selection           | Yes              | None                    |
| DROP_DOWN    | Dropdown selection         | Yes              | None                    |
| RATING       | Rating scale               | No               | `ratingConfig` required |
| LINEAR_SCALE | Numbered scale (1-5, 1-10) | No               | Similar to RATING       |
| DATE         | Date picker                | No               | Optional validation     |
| TIME         | Time picker                | No               | Optional validation     |

---

## 4. Form Response Schema (`schemas.fill.ts`)

**Purpose**: Captures submitted form responses with metadata.

**When to Use**:

- Storing form submissions
- Retrieving submitted answers
- Analyzing response data

**Input/Output Structure**:

```typescript
{
  // Identifiers
  formId: string,                   // Which form was submitted
  userId: string,                   // Who submitted (authenticated user ID)
  email: string,                    // User's email address

  // Answers
  answers: Array<{
    questionId: string,             // Which question
    values: string[]                // Array of answer values (always array for consistency)
  }>,

  // Metadata
  metadata: {
    userAgent: string,              // Browser/client info
    ipAddress: string               // Responder's IP address
  },

  // Timestamps (auto-generated)
  createdAt: Date,                  // When response was submitted
  updatedAt: Date                   // When response was last modified
}
```

**Response Uniqueness**:

- Database constraint: Only ONE response per `{formId, userId}` combination
- If user resubmits, the previous response is updated (if `allowEditResponse=true`)

---

## API Endpoint Usage Quick Reference

| Action               | Schema   | Endpoint                                           | Method |
| -------------------- | -------- | -------------------------------------------------- | ------ |
| Create Form          | Form     | `/api/forms`                                       | POST   |
| Update Form Settings | Form     | `/api/forms/:id`                                   | PATCH  |
| Create Section       | Section  | `/api/forms/:formId/sections`                      | POST   |
| Reorder Sections     | Section  | `/api/forms/:formId/sections/reorder`              | PATCH  |
| Create Question      | Question | `/api/forms/:formId/sections/:sectionId/questions` | POST   |
| Update Question      | Question | `/api/forms/:formId/questions/:id`                 | PATCH  |
| Submit Response      | Response | `/api/forms/:formId/fill`                          | POST   |
| Get Responses        | Response | `/api/forms/:formId/responses`                     | GET    |

---

## Hierarchy Diagram

```
Form (root)
├── Settings (global settings)
└── Sections[] (pages/sections)
    ├── Questions[] (individual fields)
    │   ├── Validation Rules
    │   ├── Conditional Logic
    │   └── Type-Specific Config
    └── Flow Control (onAnswer, defaultAction)

FormResponse (submission)
├── Metadata (IP, User Agent)
└── Answers[] (submitted data)
```

---

## Common Validation Rule Examples

```typescript
// Email validation
validationRule: { ruleType: 'EMAIL' }

// Min 3 characters
validationRule: { ruleType: 'MIN_CHAR_COUNT', min: 3 }

// Number between 1-100
validationRule: { ruleType: 'NUMBER_BETWEEN', min: 1, max: 100, customErrorMessage: 'Must be 1-100' }

// Date before today
validationRule: { ruleType: 'DATE_IS_BEFORE', value: new Date().toISOString() }

// At least 2 checkboxes selected
validationRule: { ruleType: 'CHECKBOX_MIN_SELECT', min: 2 }

// Custom regex pattern
validationRule: { ruleType: 'REGEX_MATCH', pattern: '^[A-Z0-9]{4,6}$', customErrorMessage: 'Code format invalid' }
```

---

## API Request/Response Format

**IMPORTANT**: All API requests and responses follow a standardized JSON wrapper format.

### Request Format

Every API request body must be wrapped inside a `data` property:

```json
{
    "data": {
        // Your actual payload here
    }
}
```

**Examples**:

**Create Form Request**:

```json
{
    "data": {
        "title": "Customer Feedback",
        "description": "Help us improve",
        "isPrivate": false,
        "isPublished": true,
        "settings": {
            "collectEmail": true,
            "progressBar": true
        }
    }
}
```

**Create Section Request**:

```json
{
    "data": {
        "title": "Personal Information",
        "description": "Please provide your details",
        "index": 0,
        "defaultAction": {
            "actionType": "NEXT_SECTION"
        }
    }
}
```

**Create Question Request**:

```json
{
    "data": {
        "type": "RADIO",
        "question": "What is your age group?",
        "helpText": "Select the range that applies to you",
        "isRequired": true,
        "options": [
            {
                "index": 0,
                "value": "18-25",
                "label": "18-25 years"
            },
            {
                "index": 1,
                "value": "26-35",
                "label": "26-35 years"
            }
        ]
    }
}
```

**Submit Form Response Request**:

```json
{
    "data": {
        "email": "user@example.com",
        "answers": [
            {
                "questionId": "q1",
                "values": ["18-25"]
            },
            {
                "questionId": "q2",
                "values": ["Option A"]
            }
        ]
    }
}
```

### Response Format

All API responses also follow the same wrapper format:

**Success Response**:

```json
{
    "data": {
        "id": "form123",
        "title": "Customer Feedback",
        "createdAt": "2026-05-29T10:00:00Z"
        // ... rest of the object
    },
    "message": "Form created successfully"
}
```

**Error Response**:

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

### Headers Required

```
Content-Type: application/json
Authorization: Bearer <token>  // If endpoint requires authentication
```

### cURL Examples

**Create a Form**:

```bash
curl -X POST http://localhost:5000/api/forms \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your_token_here" \
  -d '{
    "data": {
      "title": "My Form",
      "description": "Form description",
      "isPrivate": false,
      "isPublished": true,
      "settings": {
        "collectEmail": true
      }
    }
  }'
```

**Get Form Responses**:

```bash
curl -X GET http://localhost:5000/api/forms/form123/responses \
  -H "Authorization: Bearer your_token_here"
```

### Common HTTP Status Codes

| Code | Meaning              | Example                                              |
| ---- | -------------------- | ---------------------------------------------------- |
| 200  | Success              | Form retrieved successfully                          |
| 201  | Created              | New form created                                     |
| 400  | Bad Request          | Missing required field in request body               |
| 401  | Unauthorized         | Missing or invalid authentication token              |
| 403  | Forbidden            | User doesn't have permission to access this resource |
| 404  | Not Found            | Form/Section/Question doesn't exist                  |
| 422  | Unprocessable Entity | Validation failed (constraint violation)             |
| 429  | Too Many Requests    | Rate limit exceeded                                  |
| 500  | Server Error         | Internal server error                                |
