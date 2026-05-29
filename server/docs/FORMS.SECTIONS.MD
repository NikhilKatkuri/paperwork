# FORMS Sections

## create section

- endpoint: `/forms/{formId}/sections`
- method: `POST`
- Request body:

```json
{
    "data": {
        "index": 0,
        "title": "Introduction",
        "description": "Please fill out your personal information first.",
        "defaultAction": {
            "actionType": "NEXT_SECTION"
        }
    }
}
```

- Response body:

```json
{
    "success": true,
    "message": "Section created successfully",
    "data": {
        "section": {
            "formId": "6a18d0f3b1fd67d49b00ce6b",
            "index": 0,
            "title": "Introduction",
            "description": "Please fill out your personal information first.",
            "defaultAction": {
                "actionType": "NEXT_SECTION"
            },
            "_id": "6a18d215b1fd67d49b00ce6c",
            "onAnswer": [],
            "createdAt": "2026-05-28T23:39:01.558Z",
            "updatedAt": "2026-05-28T23:39:01.558Z"
        }
    }
}
```

## Retrieve section

- endpoint: `/forms/{formId}/sections`
- method: `GET`

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
