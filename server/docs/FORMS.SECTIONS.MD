# Sections API

Base path: `/api/v1/forms/:formId/sections`

All routes require a bearer access token. Request bodies use `{ "data": ... }`.

## Section body

```json
{
  "index": 0,
  "title": "Personal information",
  "description": "Basic details",
  "defaultAction": { "actionType": "NEXT_SECTION" },
  "onAnswer": [
    {
      "questionId": "6a18cd6d1f892e03d087047f",
      "value": "no",
      "action": { "actionType": "GO_TO_SECTION", "sectionId": "6a18cd6d1f892e03d0870480" }
    }
  ]
}
```

`index` is a non-negative integer. `title` is required and has a maximum of 255 characters. `description` has a maximum of 5000 characters. `questionId`, `sectionId`, and form IDs must be valid ObjectIds.

## Routes

| Method | Path | Body | Success |
| --- | --- | --- | --- |
| GET | `/api/v1/forms/:formId/sections` | None | `200`, `{ data: { sections } }` |
| POST | `/api/v1/forms/:formId/sections` | `{ data: section }` | `201`, `{ data: { section } }` |
| GET | `/api/v1/forms/:formId/sections/:sectionId` | None | `200`, `{ data: { section } }` |
| PUT | `/api/v1/forms/:formId/sections/:sectionId` | `{ data: section }` | `200`, `{ data: { section } }` |
| PUT | `/api/v1/forms/:formId/sections/reorder` | `{ data: [{ sectionId, index }] }` | `200`, `{ data: { sections } }` |
| DELETE | `/api/v1/forms/:formId/sections/:sectionId` | None | `204`, no body |

The update route currently uses the same required section schema as create. `reorder` uses an array directly under `data`, not `data.sections`.

## Flow actions

| `actionType` | `sectionId` |
| --- | --- |
| `NEXT_SECTION` | Not used |
| `GO_TO_SECTION` | Required |
| `SUBMIT_FORM` | Not used |

See [FORMS.QUESTIONS.MD](FORMS.QUESTIONS.MD) for questions inside a section.
