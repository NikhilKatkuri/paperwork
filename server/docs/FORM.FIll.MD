# FILL FORM DOCUMENRATION

This document provides an overview of the API endpoint for filling out a form. It describes the request and response formats, as well as any relevant details about the endpoint.

## Get Form

- **Endpoint**: `POST /forms/:formId/fill`
- **Description**: Submits responses for a specific form. The request body should contain the
- Authentication: This endpoint requires authentication. Include a valid access token in the Authorization header of the request.

- Response Body:

```JSON
{
    "success": true,
    "message": "Form retrieved successfully",
    "data": {
        "form": {
            "_id": "6a18d0f3b1fd67d49b00ce6b",
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
            "createdAt": "2026-05-28T23:34:11.964Z",
            "updatedAt": "2026-05-29T00:11:53.532Z"
        },
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
                        "placeholder": "choose gracefully",
                        "isRequired": false
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
                        "isRequired": true
                    }
                ]
            }
        ]
    }
}
```

## fill

- **Endpoint**: `POST /forms/:formId/fill`
- **Description**: Submits responses for a specific form. The request body should contain the answers to the form questions.
- **Authentication**: This endpoint requires authentication. Include a valid access token in the Authorization header

- **Request Body**:

```JSON
{
    "data": [
        {
            "questionId": "6a18d4b8b1fd67d49b00ce6f",
            "values": 4
        },
        {
            "questionId": "6a18d369b1fd67d49b00ce6d",
            "values": "John Doe"
        }
    ]
}
```

- **Response Body**:

```JSON
{
    "success": true,
    "message": "Form submitted successfully",
}
```
