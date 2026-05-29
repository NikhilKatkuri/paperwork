# Questions form

This form is used to create and edit questions. It contains the following fields:

## CREATE question

- endpoint: `/forms/{formId}/sections/{sectionId}/questions`
- method: `POST`
- Request body:

```JSON
{
  "data": {
    "type": "TEXT",
    "question": "What is your full name?",
    "helpText": "Please provide your legal name as per ID.",
    "isRequired": true,
    "placeholder": "e.g. John Doe"
  }
}
```

- Response body:

```JSON
{
    "success": true,
    "message": "Question created successfully",
    "data": {
        "question": {
            "formId": "6a18d0f3b1fd67d49b00ce6b",
            "sectionId": "6a18d215b1fd67d49b00ce6c",
            "index": 0,
            "type": "TEXT",
            "question": "What is your full name?",
            "helpText": "Please provide your legal name as per ID.",
            "placeholder": "e.g. John Doe",
            "isRequired": true,
            "_id": "6a18d369b1fd67d49b00ce6d",
            "createdAt": "2026-05-28T23:44:41.164Z",
            "updatedAt": "2026-05-28T23:44:41.164Z"
        }
    }
}
```

## Retrieve questions

- endpoint: `/forms/{formId}/sections/{sectionId}/questions`
- method: `GET`
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
