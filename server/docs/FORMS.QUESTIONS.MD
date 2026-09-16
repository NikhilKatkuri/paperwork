# Questions API

Base path: `/api/v1/forms/:formId/sections/:sectionId/questions`

All routes require a bearer access token. Request bodies use `{ "data": ... }`.

## Routes

| Method | Path | Body | Success |
| --- | --- | --- | --- |
| POST | `/api/v1/forms/:formId/sections/:sectionId/questions` | `{ data: question }` | `201`, `{ data: { question } }` |
| POST | `/api/v1/forms/:formId/sections/:sectionId/questions/bulk` | `{ data: question[] }` | `201`, `{ data: { questions } }` |
| GET | `/api/v1/forms/:formId/sections/:sectionId/questions` | None | `200`, `{ data: { questions } }` |
| PUT | `/api/v1/forms/:formId/sections/:sectionId/questions/:questionId` | `{ data: question }` | `200`, `{ data: { question } }` |
| GET | `/api/v1/forms/:formId/sections/:sectionId/questions/:questionId` | None | `200`, `{ data: { question } }` |
| PUT | `/api/v1/forms/:formId/sections/:sectionId/questions/reorder` | `{ data: [{ questionId, index }] }` | `200`, `{ data: { questions } }` |
| DELETE | `/api/v1/forms/:formId/sections/:sectionId/questions/:questionId` | None | `204`, no body |

## Question body

```json
{
  "type": "RADIO",
  "question": "Which plan do you use?",
  "helpText": "Choose one",
  "placeholder": "",
  "isRequired": true,
  "optionsConfig": {
    "options": [
      { "index": 0, "label": "Free" },
      { "index": 1, "label": "Pro" }
    ]
  }
}
```

Create/update questions do not accept `_id` or `index`; those are assigned by the service. Bulk form updates require both `_id` and `index`.

## Types and required config

- `TEXT`, `PARAGRAPH`, `DATE`, `TIME`: no type-specific config.
- `CHOICE`, `RADIO`, `DROP_DOWN`: require `optionsConfig.options`; each option has `index` and `label`.
- `LINEAR_SCALE`, `RATING`: require `ratingConfig` with `icon` (`STAR`, `HEART`, or `THUMB_UP`) and scale `5` or `10`.

Common fields include `question` (1..1000 characters), `helpText` (maximum 500), `placeholder` (maximum 100), `isRequired` (default `false`), `dependsOn`, and `validationRule`.

```json
{
  "dependsOn": {
    "questionId": "6a18cd6d1f892e03d087047f",
    "value": "other"
  },
  "validationRule": {
    "ruleType": "NUMBER_BETWEEN",
    "min": 1,
    "max": 100,
    "customErrorMessage": "Enter a value from 1 to 100"
  }
}
```

Supported rule types are `EMAIL`, `URL`, `NUMBER_GREATER_THAN`, `NUMBER_LESS_THAN`, `REGEX_MATCH`, `MAX_CHAR_COUNT`, `NUMBER_EQUAL_TO`, `NUMBER_BETWEEN`, `MIN_CHAR_COUNT`, `DATE_IS_BEFORE`, `DATE_IS_AFTER`, `CHECKBOX_MIN_SELECT`, and `CHECKBOX_MAX_SELECT`. `customErrorMessage` is optional and limited to 200 characters.

See [FORM.FIll.MD](FORM.FIll.MD) for submitting answers.
