# FORM API DOCS

This directory contains documentation for the FORM API. The FORM API is a set of functions that allow you to create and manipulate forms in your application. The documentation is organized into sections based on the different types of forms you can create, such as text input forms, select forms, and checkbox forms. Each section contains detailed information about the functions available for that type of form, including examples of how to use them. Whether you're new to the FORM API or an experienced developer, this documentation will help you get the most out of the API and create powerful forms for your application.

## Creating Forms

- endpoint: `{{BASE_URL}}/forms`
- method: `POST`
- Authentication: Required
- Request Body:

```JSON
    {
    "data": {
    "title": "Q3 Engineering Performance Feedback",
    "description": "Please provide your insights on the recent sprint deliverables and team collaboration.",
    "isPrivate": true,
    "isPublished": false,
    "allowedDomains": ["company.com", "partner.org"],
    "settings": {
    "maxResponses": 500,
    "maxResponsesPerUser": 1,
    "closeDate": "2026-12-31T23:59:59Z",
    "startDate": "2026-06-01T09:00:00Z",
    "timeLimitPerResponse": 1800,
    "collectEmail": true,
    "shuffleQuestions": true,
    "allowEditResponse": false,
    "saveAndContinueLater": true,
    "progressBar": true,
    "customConfirmationMessage": "Thank you for your feedback! The leadership team will review your inputs shortly.",
    "redirectUrl": "https://intranet.company.com/success"
    }
    }
    }
```

-- Response:

```JSON
{
"success": true,
"message": "Form created successfully",
"data": {
"form": {
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
"_id": "6a18cd6d1f892e03d087047f",
"createdAt": "2026-05-28T23:19:09.675Z",
"updatedAt": "2026-05-28T23:19:09.675Z"
}
}
}
```

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
```

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
