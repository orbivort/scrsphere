# Daily Scrum API

Complete Daily Scrum API reference for daily update management, team status tracking, and impediment promotion.

## Table of Contents

- [Overview](#overview)
- [Authentication](#authentication)
- [Endpoints](#endpoints)
  - [Get Team Members with Update Status](#get-team-members-with-update-status)
  - [Get Daily Updates for Sprint](#get-daily-updates-for-sprint)
  - [Create Daily Update](#create-daily-update)
  - [Get Daily Update by ID](#get-daily-update-by-id)
  - [Update Daily Update](#update-daily-update)
  - [Delete Daily Update](#delete-daily-update)
  - [Promote Impediment](#promote-impediment)
  - [Send Daily Update Reminder](#send-daily-update-reminder)
- [Error Codes](#error-codes)
- [Best Practices](#best-practices)

## Overview

The Daily Scrum API provides comprehensive daily update management capabilities including:

- Daily update creation and editing
- Team member update status tracking
- Impediment promotion from daily updates to formal records
- Daily update reminder notifications
- Sprint-scoped update retrieval with date filtering

All endpoints are scoped under `/api/v1/daily-updates`.

## Authentication

All daily scrum endpoints require authentication. Include the access token in your request:

**Using Cookies (Recommended)**

```http
GET /api/v1/daily-updates/:sprintId
Cookie: accessToken=eyJhbGc...
```

**Using Bearer Token**

```http
GET /api/v1/daily-updates/:sprintId
Authorization: Bearer eyJhbGc...
```

## Endpoints

### Get Team Members with Update Status

Get team members along with their daily update submission status for a specific sprint and date.

**Endpoint**

```
GET /api/v1/daily-updates/:sprintId/team-status
```

**Authentication**

- Required

**Path Parameters**

- `sprintId` (string, required): Sprint UUID

**Query Parameters**

- `date` (string, optional): Date in YYYY-MM-DD format. If omitted, returns empty submitted and pending lists.

**Success Response**

```http
HTTP/1.1 200 OK
Content-Type: application/json

{
  "success": true,
  "data": {
    "submitted": [
      {
        "id": "550e8400-e29b-41d4-a716-446655440010",
        "sprintId": "550e8400-e29b-41d4-a716-446655440000",
        "userId": "550e8400-e29b-41d4-a716-446655440001",
        "updateDate": "2026-05-10",
        "yesterdayWork": "Completed login page",
        "todayWork": "Working on dashboard",
        "impediment": null,
        "createdAt": "2026-05-10T09:00:00.000Z",
        "createdBy": "550e8400-e29b-41d4-a716-446655440001",
        "updatedAt": "2026-05-10T09:00:00.000Z",
        "updatedBy": "550e8400-e29b-41d4-a716-446655440001",
        "user": {
          "id": "550e8400-e29b-41d4-a716-446655440001",
          "firstName": "John",
          "lastName": "Doe",
          "email": "john@example.com"
        }
      }
    ],
    "pending": [
      {
        "userId": "550e8400-e29b-41d4-a716-446655440002",
        "userName": "Jane Smith"
      }
    ]
  }
}
```

**Error Responses**

**400 Bad Request - Invalid Date Format**

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid date format. Expected YYYY-MM-DD"
  }
}
```

**404 Not Found - Sprint Not Found**

```json
{
  "success": false,
  "error": {
    "code": "NOT_FOUND",
    "message": "Sprint not found"
  }
}
```

**Example Request**

```bash
curl -X GET "https://api.scrsphere.dev/api/v1/daily-updates/550e8400-e29b-41d4-a716-446655440000/team-status?date=2026-05-10" \
  -b cookies.txt
```

---

### Get Daily Updates for Sprint

Get all daily updates for a specific sprint, optionally filtered by date.

**Endpoint**

```
GET /api/v1/daily-updates/:sprintId
```

**Authentication**

- Required

**Path Parameters**

- `sprintId` (string, required): Sprint UUID

**Query Parameters**

- `date` (string, optional): Date in YYYY-MM-DD format to filter updates

**Success Response**

```http
HTTP/1.1 200 OK
Content-Type: application/json

{
  "success": true,
  "data": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440010",
      "sprintId": "550e8400-e29b-41d4-a716-446655440000",
      "userId": "550e8400-e29b-41d4-a716-446655440001",
      "updateDate": "2026-05-10",
      "yesterdayWork": "Completed login page",
      "todayWork": "Working on dashboard",
      "impediment": "Blocked by API dependency",
      "createdAt": "2026-05-10T09:00:00.000Z",
      "createdBy": "550e8400-e29b-41d4-a716-446655440001",
      "updatedAt": "2026-05-10T09:00:00.000Z",
      "updatedBy": "550e8400-e29b-41d4-a716-446655440001",
      "user": {
        "id": "550e8400-e29b-41d4-a716-446655440001",
        "firstName": "John",
        "lastName": "Doe",
        "email": "john@example.com"
      },
      "impedimentRecord": null
    }
  ]
}
```

**Error Responses**

**400 Bad Request - Invalid Date Format**

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid date format. Expected YYYY-MM-DD"
  }
}
```

**Example Request**

```bash
curl -X GET "https://api.scrsphere.dev/api/v1/daily-updates/550e8400-e29b-41d4-a716-446655440000?date=2026-05-10" \
  -b cookies.txt
```

---

### Create Daily Update

Create a new daily update for the authenticated user in a sprint. Only one update per user per day is allowed.

**Endpoint**

```
POST /api/v1/daily-updates/:sprintId
```

**Authentication**

- Required

**Path Parameters**

- `sprintId` (string, required): Sprint UUID

**Request Body**

```json
{
  "yesterdayWork": "string (optional, max 2000 chars)",
  "todayWork": "string (optional, max 2000 chars)",
  "impediment": "string (optional, max 2000 chars)"
}
```

**Success Response**

```http
HTTP/1.1 201 Created
Content-Type: application/json

{
  "success": true,
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440010",
    "sprintId": "550e8400-e29b-41d4-a716-446655440000",
    "userId": "550e8400-e29b-41d4-a716-446655440001",
    "updateDate": "2026-05-10",
    "yesterdayWork": "Completed login page",
    "todayWork": "Working on dashboard",
    "impediment": null,
    "createdAt": "2026-05-10T09:00:00.000Z",
    "createdBy": "550e8400-e29b-41d4-a716-446655440001",
    "updatedAt": "2026-05-10T09:00:00.000Z",
    "updatedBy": "550e8400-e29b-41d4-a716-446655440001",
    "user": {
      "id": "550e8400-e29b-41d4-a716-446655440001",
      "firstName": "John",
      "lastName": "Doe",
      "email": "john@example.com"
    }
  }
}
```

**Error Responses**

**400 Bad Request - Validation Error**

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Validation failed",
    "details": [
      {
        "field": "yesterdayWork",
        "message": "yesterdayWork must be at most 2000 characters"
      }
    ]
  }
}
```

**404 Not Found - Sprint Not Found**

```json
{
  "success": false,
  "error": {
    "code": "NOT_FOUND",
    "message": "Sprint not found"
  }
}
```

**409 Conflict - Update Already Exists**

```json
{
  "success": false,
  "error": {
    "code": "CONFLICT",
    "message": "Daily update already exists for today. Please edit your existing update."
  }
}
```

**Example Request**

```bash
curl -X POST https://api.scrsphere.dev/api/v1/daily-updates/550e8400-e29b-41d4-a716-446655440000 \
  -H "Content-Type: application/json" \
  -b cookies.txt \
  -d '{
    "yesterdayWork": "Completed login page and code review",
    "todayWork": "Working on dashboard component",
    "impediment": "Waiting for API endpoint from backend team"
  }'
```

---

### Get Daily Update by ID

Get a single daily update by its unique identifier.

**Endpoint**

```
GET /api/v1/daily-updates/update/:id
```

**Authentication**

- Required

**Path Parameters**

- `id` (string, required): Daily update UUID

**Success Response**

```http
HTTP/1.1 200 OK
Content-Type: application/json

{
  "success": true,
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440010",
    "sprintId": "550e8400-e29b-41d4-a716-446655440000",
    "userId": "550e8400-e29b-41d4-a716-446655440001",
    "updateDate": "2026-05-10",
    "yesterdayWork": "Completed login page",
    "todayWork": "Working on dashboard",
    "impediment": null,
    "createdAt": "2026-05-10T09:00:00.000Z",
    "createdBy": "550e8400-e29b-41d4-a716-446655440001",
    "updatedAt": "2026-05-10T09:00:00.000Z",
    "updatedBy": "550e8400-e29b-41d4-a716-446655440001",
    "user": {
      "id": "550e8400-e29b-41d4-a716-446655440001",
      "firstName": "John",
      "lastName": "Doe",
      "email": "john@example.com"
    }
  }
}
```

**Error Responses**

**400 Bad Request - Invalid ID**

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid daily update ID"
  }
}
```

**Example Request**

```bash
curl -X GET https://api.scrsphere.dev/api/v1/daily-updates/update/550e8400-e29b-41d4-a716-446655440010 \
  -b cookies.txt
```

---

### Update Daily Update

Update an existing daily update. Only the author of the update can edit it.

**Endpoint**

```
PUT /api/v1/daily-updates/update/:id
```

**Authentication**

- Required
- Only the update author can modify the update

**Path Parameters**

- `id` (string, required): Daily update UUID

**Request Body**

```json
{
  "yesterdayWork": "string (optional, max 2000 chars)",
  "todayWork": "string (optional, max 2000 chars)",
  "impediment": "string (optional, max 2000 chars)"
}
```

**Success Response**

```http
HTTP/1.1 200 OK
Content-Type: application/json

{
  "success": true,
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440010",
    "sprintId": "550e8400-e29b-41d4-a716-446655440000",
    "userId": "550e8400-e29b-41d4-a716-446655440001",
    "updateDate": "2026-05-10",
    "yesterdayWork": "Completed login page and fixed bugs",
    "todayWork": "Working on dashboard and API integration",
    "impediment": "Waiting for API endpoint from backend team",
    "createdAt": "2026-05-10T09:00:00.000Z",
    "createdBy": "550e8400-e29b-41d4-a716-446655440001",
    "updatedAt": "2026-05-10T10:30:00.000Z",
    "updatedBy": "550e8400-e29b-41d4-a716-446655440001",
    "user": {
      "id": "550e8400-e29b-41d4-a716-446655440001",
      "firstName": "John",
      "lastName": "Doe",
      "email": "john@example.com"
    }
  }
}
```

**Error Responses**

**400 Bad Request - Not the Author**

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "You can only edit your own daily updates"
  }
}
```

**404 Not Found - Update Not Found**

```json
{
  "success": false,
  "error": {
    "code": "NOT_FOUND",
    "message": "Daily update not found"
  }
}
```

**Example Request**

```bash
curl -X PUT https://api.scrsphere.dev/api/v1/daily-updates/update/550e8400-e29b-41d4-a716-446655440010 \
  -H "Content-Type: application/json" \
  -b cookies.txt \
  -d '{
    "yesterdayWork": "Completed login page and fixed bugs",
    "todayWork": "Working on dashboard and API integration",
    "impediment": "Waiting for API endpoint from backend team"
  }'
```

---

### Delete Daily Update

Delete a daily update. Only the author of the update can delete it.

**Endpoint**

```
DELETE /api/v1/daily-updates/update/:id
```

**Authentication**

- Required
- Only the update author can delete the update

**Path Parameters**

- `id` (string, required): Daily update UUID

**Success Response**

```http
HTTP/1.1 200 OK
Content-Type: application/json

{
  "success": true,
  "data": {
    "message": "Daily update deleted successfully"
  }
}
```

**Error Responses**

**400 Bad Request - Not the Author**

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "You can only delete your own daily updates"
  }
}
```

**404 Not Found - Update Not Found**

```json
{
  "success": false,
  "error": {
    "code": "NOT_FOUND",
    "message": "Daily update not found"
  }
}
```

**Example Request**

```bash
curl -X DELETE https://api.scrsphere.dev/api/v1/daily-updates/update/550e8400-e29b-41d4-a716-446655440010 \
  -b cookies.txt
```

---

### Promote Impediment

Promote an impediment from a daily update into a formal impediment record. The daily update must contain impediment text and must not already have an associated impediment record.

**Endpoint**

```
POST /api/v1/daily-updates/:id/promote-impediment
```

**Authentication**

- Required

**Path Parameters**

- `id` (string, required): Daily update UUID

**Request Body**

```json
{
  "title": "string (required, 3-200 chars)",
  "description": "string (required, 10-2000 chars)",
  "ownerId": "string (optional, user UUID)",
  "priority": "string (optional, one of: High, Medium, Low)",
  "teamId": "string (required, team UUID)",
  "sprintId": "string (optional, sprint UUID)"
}
```

**Success Response**

```http
HTTP/1.1 201 Created
Content-Type: application/json

{
  "success": true,
  "data": {
    "dailyUpdate": {
      "id": "550e8400-e29b-41d4-a716-446655440010",
      "sprintId": "550e8400-e29b-41d4-a716-446655440000",
      "userId": "550e8400-e29b-41d4-a716-446655440001",
      "updateDate": "2026-05-10",
      "yesterdayWork": "Completed login page",
      "todayWork": "Working on dashboard",
      "impediment": "Waiting for API endpoint from backend team",
      "createdAt": "2026-05-10T09:00:00.000Z",
      "createdBy": "550e8400-e29b-41d4-a716-446655440001",
      "updatedAt": "2026-05-10T09:00:00.000Z",
      "updatedBy": "550e8400-e29b-41d4-a716-446655440001",
      "user": {
        "id": "550e8400-e29b-41d4-a716-446655440001",
        "firstName": "John",
        "lastName": "Doe",
        "email": "john@example.com"
      },
      "impedimentRecord": {
        "id": "550e8400-e29b-41d4-a716-446655440020",
        "status": "OPEN",
        "title": "API dependency blocking dashboard work",
        "reportedBy": {
          "id": "550e8400-e29b-41d4-a716-446655440001",
          "firstName": "John",
          "lastName": "Doe"
        },
        "owner": null
      }
    },
    "impediment": {
      "id": "550e8400-e29b-41d4-a716-446655440020",
      "teamId": "550e8400-e29b-41d4-a716-446655440099",
      "sprintId": "550e8400-e29b-41d4-a716-446655440000",
      "title": "API dependency blocking dashboard work",
      "description": "The backend API endpoint for dashboard data is not yet available, blocking frontend dashboard development.",
      "reportedById": "550e8400-e29b-41d4-a716-446655440001",
      "ownerId": null,
      "status": "OPEN",
      "resolution": null,
      "resolvedAt": null,
      "dailyUpdateId": "550e8400-e29b-41d4-a716-446655440010",
      "createdAt": "2026-05-10T10:00:00.000Z",
      "createdBy": "550e8400-e29b-41d4-a716-446655440001",
      "updatedAt": "2026-05-10T10:00:00.000Z",
      "updatedBy": null,
      "reportedBy": {
        "id": "550e8400-e29b-41d4-a716-446655440001",
        "firstName": "John",
        "lastName": "Doe",
        "email": "john@example.com"
      },
      "owner": null,
      "sprint": {
        "id": "550e8400-e29b-41d4-a716-446655440000",
        "name": "Sprint 5"
      },
      "dailyUpdate": {
        "id": "550e8400-e29b-41d4-a716-446655440010",
        "sprintId": "550e8400-e29b-41d4-a716-446655440000",
        "userId": "550e8400-e29b-41d4-a716-446655440001",
        "updateDate": "2026-05-10",
        "yesterdayWork": "Completed login page",
        "todayWork": "Working on dashboard",
        "impediment": "Waiting for API endpoint from backend team",
        "createdAt": "2026-05-10T09:00:00.000Z",
        "createdBy": "550e8400-e29b-41d4-a716-446655440001",
        "updatedAt": "2026-05-10T09:00:00.000Z",
        "updatedBy": "550e8400-e29b-41d4-a716-446655440001",
        "user": {
          "id": "550e8400-e29b-41d4-a716-446655440001",
          "firstName": "John",
          "lastName": "Doe",
          "email": "john@example.com"
        }
      }
    }
  }
}
```

**Error Responses**

**400 Bad Request - No Impediment Text**

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "No impediment text to promote"
  }
}
```

**400 Bad Request - Already Promoted**

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Impediment already created from this daily update"
  }
}
```

**400 Bad Request - Validation Error**

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Validation failed",
    "details": [
      {
        "field": "title",
        "message": "Title must be at least 3 characters"
      }
    ]
  }
}
```

**404 Not Found - Daily Update Not Found**

```json
{
  "success": false,
  "error": {
    "code": "NOT_FOUND",
    "message": "Daily update not found"
  }
}
```

**Example Request**

```bash
curl -X POST https://api.scrsphere.dev/api/v1/daily-updates/550e8400-e29b-41d4-a716-446655440010/promote-impediment \
  -H "Content-Type: application/json" \
  -b cookies.txt \
  -d '{
    "title": "API dependency blocking dashboard work",
    "description": "The backend API endpoint for dashboard data is not yet available, blocking frontend dashboard development.",
    "teamId": "550e8400-e29b-41d4-a716-446655440099",
    "sprintId": "550e8400-e29b-41d4-a716-446655440000",
    "priority": "High"
  }'
```

---

### Send Daily Update Reminder

Send a daily update reminder notification to team members who have not yet submitted their update for the current day.

**Endpoint**

```
POST /api/v1/daily-updates/:sprintId/send-reminder
```

**Authentication**

- Required

**Path Parameters**

- `sprintId` (string, required): Sprint UUID

**Success Response**

```http
HTTP/1.1 200 OK
Content-Type: application/json

{
  "success": true,
  "data": {
    "sentCount": 2,
    "totalPending": 2,
    "message": "Reminders sent to 2 team members"
  }
}
```

**All Members Submitted Response**

```http
HTTP/1.1 200 OK
Content-Type: application/json

{
  "success": true,
  "data": {
    "sentCount": 0,
    "message": "All team members have submitted their updates"
  }
}
```

**Partial Failure Response**

```http
HTTP/1.1 200 OK
Content-Type: application/json

{
  "success": true,
  "data": {
    "sentCount": 1,
    "totalPending": 2,
    "message": "Reminders sent to 1 team member",
    "errors": [
      "Failed to send reminder to Jane Smith"
    ]
  }
}
```

**Error Responses**

**400 Bad Request - Sprint Not Found**

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Sprint not found"
  }
}
```

**Example Request**

```bash
curl -X POST https://api.scrsphere.dev/api/v1/daily-updates/550e8400-e29b-41d4-a716-446655440000/send-reminder \
  -b cookies.txt
```

---

## Error Codes

| Code                   | HTTP Status | Description                                          |
| ---------------------- | ----------- | ---------------------------------------------------- |
| `VALIDATION_ERROR`     | 400         | Request validation failed or business rule violation |
| `AUTHENTICATION_ERROR` | 401         | Authentication required                              |
| `AUTHORIZATION_ERROR`  | 403         | Insufficient permissions                             |
| `NOT_FOUND`            | 404         | Sprint or daily update not found                     |
| `CONFLICT`             | 409         | Daily update already exists for today                |

## Best Practices

### Daily Update Management

1. **Timely Submissions**: Encourage team members to submit updates at the start of each working day
2. **Concise Updates**: Keep yesterdayWork, todayWork, and impediment descriptions clear and concise
3. **Impediment Promotion**: Promote impediments to formal records when they require team attention or tracking
4. **Reminder Etiquette**: Use the send-reminder endpoint judiciously; avoid spamming team members

### Security

1. **Author-Only Edits**: Only the update author can modify or delete their daily updates
2. **Audit Trail**: All daily update changes are tracked with createdBy and updatedBy fields
3. **Team Scoping**: Daily updates are scoped to sprints within the team context

### Integration Tips

1. **Date Filtering**: Use the `date` query parameter to retrieve updates for specific days rather than fetching all
2. **Team Status**: Use the team-status endpoint to build daily standup dashboards showing who has and has not submitted
3. **Impediment Workflow**: After promoting an impediment, use the Impediments API to track resolution progress

---

**Last Updated**: 2026-05-10

**Related Documentation**

- [Authentication API](./authentication.md)
- [Impediments API](./impediments.md)
- [Sprints API](./sprints.md)
- [Teams API](./teams.md)
