# Daily Scrum API

Complete Daily Scrum API reference for the team-level, goal-focused Daily Scrum (`/api/v1/daily-scrums`) and the legacy per-user daily update endpoints (`/api/v1/daily-updates`).

## Table of Contents

- [Overview](#overview)
- [Authentication](#authentication)
- [Team-Level Daily Scrum Endpoints](#team-level-daily-scrum-endpoints)
  - [Get Today's Daily Scrum](#get-todays-daily-scrum)
  - [Get Daily Scrums for Sprint](#get-daily-scrums-for-sprint)
  - [Create Daily Scrum](#create-daily-scrum)
  - [Get Daily Scrum by ID](#get-daily-scrum-by-id)
  - [Update Daily Scrum](#update-daily-scrum)
  - [Record Participation](#record-participation)
  - [Get Participation](#get-participation)
  - [Send Team-Wide Signal](#send-team-wide-signal)
  - [Promote Impediment from Daily Scrum](#promote-impediment-from-daily-scrum)
- [Legacy Daily Update Endpoints](#legacy-daily-update-endpoints)
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

The Daily Scrum is a 15-minute event for the Developers to inspect progress toward the Sprint Goal and adapt the Sprint Backlog. Scrumooth models this as a **team-level record** per Sprint per day, not a per-user status report.

### Team-Level Daily Scrum (`/api/v1/daily-scrums`)

The team-level API provides:

- A single team-level Daily Scrum record per Sprint per date
- Goal-focused fields (`progressNotes`, `adaptationsNotes`, `planForNextDay`)
- Developer-chosen structure (`focusMode`) saved with the record
- Optional Sprint Backlog adjustment linkage
- Participation tracking (who contributed, not who "owes" a report)
- A neutral team-wide signal to gather the Developers
- Impediment promotion from the Daily Scrum to a formal record

### Legacy Daily Updates (`/api/v1/daily-updates`)

The legacy per-user "three-question" endpoints are retained during the migration window. New integrations should use the team-level endpoints above.

## Authentication

All daily scrum endpoints require authentication. Include the access token in your request:

Reading endpoints are open to any team member. Because the Daily Scrum is an event for the Developers (Scrum Guide), the write endpoints that create, update, or record participation for a Daily Scrum require the caller to hold the **Developer** role in the sprint's team. A non-Developer (e.g. Product Owner or Scrum Master) receives `403 Forbidden` when attempting these operations.

**Using Cookies (Recommended)**

```http
GET /api/v1/daily-scrums/:sprintId/today
Cookie: accessToken=eyJhbGc...
```

**Using Bearer Token**

```http
GET /api/v1/daily-scrums/:sprintId/today
Authorization: Bearer eyJhbGc...
```

## Team-Level Daily Scrum Endpoints

### Get Today's Daily Scrum

Get the team-level Daily Scrum for a sprint, defaulting to today.

**Endpoint**

```
GET /api/v1/daily-scrums/:sprintId/today
```

**Authentication**

- Required

**Path Parameters**

- `sprintId` (string, required): Sprint UUID

**Query Parameters**

- `date` (string, optional): Date in YYYY-MM-DD format. Defaults to today.

**Success Response**

```http
HTTP/1.1 200 OK
Content-Type: application/json

{
  "success": true,
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440010",
    "sprintId": "550e8400-e29b-41d4-a716-446655440000",
    "scrumDate": "2026-05-10",
    "progressNotes": "On track toward the Sprint Goal",
    "adaptationsNotes": "Reassigned password-reset to Carol",
    "planForNextDay": "Carol and Bob pair on password-reset email",
    "focusMode": "goal",
    "participants": [
      {
        "id": "550e8400-e29b-41d4-a716-446655440030",
        "userId": "550e8400-e29b-41d4-a716-446655440001",
        "user": {
          "id": "550e8400-e29b-41d4-a716-446655440001",
          "firstName": "John",
          "lastName": "Doe",
          "email": "john@example.com"
        }
      }
    ],
    "backlogAdjustments": [
      {
        "id": "550e8400-e29b-41d4-a716-446655440040",
        "sprintBacklogItemId": "550e8400-e29b-41d4-a716-446655440050",
        "action": "reassigned",
        "sprintBacklogItem": {
          "id": "550e8400-e29b-41d4-a716-446655440050",
          "pbiId": "550e8400-e29b-41d4-a716-446655440060",
          "pbi": { "id": "550e8400-e29b-41d4-a716-446655440060", "title": "Password reset" }
        }
      }
    ]
  }
}
```

When no record exists for the date, `data` is `null`.

---

### Get Daily Scrums for Sprint

Get all team-level Daily Scrums for a sprint, optionally filtered by date.

**Endpoint**

```
GET /api/v1/daily-scrums/:sprintId
```

**Authentication**

- Required

**Path Parameters**

- `sprintId` (string, required): Sprint UUID

**Query Parameters**

- `date` (string, optional): Date in YYYY-MM-DD format

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
      "scrumDate": "2026-05-10",
      "progressNotes": "On track toward the Sprint Goal",
      "adaptationsNotes": null,
      "planForNextDay": "Pair on feature Y",
      "focusMode": "impediment",
      "participants": [],
      "backlogAdjustments": []
    }
  ]
}
```

---

### Create Daily Scrum

Create the team-level Daily Scrum for a sprint on today's date. Only one record per Sprint per day is allowed.

**Endpoint**

```
POST /api/v1/daily-scrums/:sprintId
```

**Authentication**

- Required

**Path Parameters**

- `sprintId` (string, required): Sprint UUID

**Request Body**

```json
{
  "progressNotes": "string (optional, max 2000 chars)",
  "adaptationsNotes": "string (optional, max 2000 chars)",
  "planForNextDay": "string (optional, max 2000 chars)",
  "focusMode": "'goal' | 'backlog' | 'impediment' | 'pair' (optional, null to clear)",
  "backlogAdjustments": [
    {
      "sprintBacklogItemId": "string (required, item UUID)",
      "action": "string (required, max 500 chars)"
    }
  ]
}
```

All fields are optional because the Developers choose the structure. The creator is automatically recorded as a participant.

**Success Response**

```http
HTTP/1.1 201 Created
Content-Type: application/json

{
  "success": true,
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440010",
    "sprintId": "550e8400-e29b-41d4-a716-446655440000",
    "scrumDate": "2026-05-10",
    "progressNotes": "On track toward the Sprint Goal",
    "planForNextDay": "Pair on feature Y",
    "participants": [],
    "backlogAdjustments": []
  }
}
```

**Error Responses**

**409 Conflict - Record Already Exists**

```json
{
  "success": false,
  "error": {
    "code": "CONFLICT",
    "message": "A Daily Scrum already exists for today. Please edit the existing record."
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

---

### Get Daily Scrum by ID

Get a single team-level Daily Scrum by its identifier.

**Endpoint**

```
GET /api/v1/daily-scrums/record/:id
```

**Authentication**

- Required

**Path Parameters**

- `id` (string, required): Daily Scrum UUID

**Success Response**

```http
HTTP/1.1 200 OK
Content-Type: application/json

{
  "success": true,
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440010",
    "sprintId": "550e8400-e29b-41d4-a716-446655440000",
    "scrumDate": "2026-05-10",
    "progressNotes": "On track toward the Sprint Goal",
    "adaptationsNotes": null,
    "planForNextDay": "Pair on feature Y",
    "focusMode": "goal",
    "participants": [],
    "backlogAdjustments": []
  }
}
```

---

### Update Daily Scrum

Update the team-level Daily Scrum by ID.

**Endpoint**

```
PUT /api/v1/daily-scrums/record/:id
```

**Authentication**

- Required

**Path Parameters**

- `id` (string, required): Daily Scrum UUID

**Request Body**

Same shape as the create request body (all optional).

**Success Response**

```http
HTTP/1.1 200 OK
Content-Type: application/json

{
  "success": true,
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440010",
    "sprintId": "550e8400-e29b-41d4-a716-446655440000",
    "scrumDate": "2026-05-10",
    "progressNotes": "On track toward the Sprint Goal",
    "planForNextDay": "Adapted plan",
    "participants": [],
    "backlogAdjustments": []
  }
}
```

When `backlogAdjustments` is provided, the existing adjustments are replaced wholesale.

---

### Record Participation

Record the current user as a participant of a team-level Daily Scrum. This reflects contribution without creating a per-user report.

**Endpoint**

```
POST /api/v1/daily-scrums/record/:id/participate
```

**Authentication**

- Required

**Path Parameters**

- `id` (string, required): Daily Scrum UUID

**Success Response**

```http
HTTP/1.1 200 OK
Content-Type: application/json

{
  "success": true,
  "data": { "id": "550e8400-e29b-41d4-a716-446655440010" }
}
```

---

### Get Participation

Get participation for a sprint on a date, without status-report framing.

**Endpoint**

```
GET /api/v1/daily-scrums/:sprintId/participation
```

**Authentication**

- Required

**Path Parameters**

- `sprintId` (string, required): Sprint UUID

**Query Parameters**

- `date` (string, required): Date in YYYY-MM-DD format

**Success Response**

```http
HTTP/1.1 200 OK
Content-Type: application/json

{
  "success": true,
  "data": {
    "dailyScrum": { "id": "550e8400-e29b-41d4-a716-446655440010" },
    "participants": [
      { "id": "550e8400-e29b-41d4-a716-446655440030", "userId": "550e8400-e29b-41d4-a716-446655440001", "userName": "John Doe" }
    ],
    "nonParticipants": [
      { "userId": "550e8400-e29b-41d4-a716-446655440002", "userName": "Jane Smith" }
    ]
  }
}
```

---

### Send Team-Wide Signal

Send a neutral team-wide Daily Scrum signal to gather the Developers who have **not yet joined** today's Daily Scrum. Because the Daily Scrum is a Developers-only event (Scrum Guide), the signal targets only non-joined Developers — Product Owner and Scrum Master are excluded, as are Developers who have already joined. It does not demand an individual report from anyone.

**Endpoint**

```
POST /api/v1/daily-scrums/:sprintId/team-signal
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
    "message": "Daily Scrum signal sent to 2 team members"
  }
}
```

**Notes**

- `sentCount` is the number of Developers who have not yet joined the Daily Scrum for today.
- The Product Owner, Scrum Master, and Developers who already joined do not receive the signal.

---

### Promote Impediment from Daily Scrum

Promote an impediment raised in a Daily Scrum into a formal Impediment record.

**Endpoint**

```
POST /api/v1/daily-scrums/:id/promote-impediment
```

**Authentication**

- Required

**Path Parameters**

- `id` (string, required): Daily Scrum UUID

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
    "dailyScrum": { "id": "550e8400-e29b-41d4-a716-446655440010" },
    "impediment": {
      "id": "550e8400-e29b-41d4-a716-446655440020",
      "title": "API access blocked",
      "status": "OPEN"
    }
  }
}
```

---

## Legacy Daily Update Endpoints

The following legacy endpoints under `/api/v1/daily-updates` are retained during the migration window. New integrations should use the team-level endpoints above.

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
curl -X GET "https://api.scrumooth.dev/api/v1/daily-updates/550e8400-e29b-41d4-a716-446655440000/team-status?date=2026-05-10" \
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
curl -X GET "https://api.scrumooth.dev/api/v1/daily-updates/550e8400-e29b-41d4-a716-446655440000?date=2026-05-10" \
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
curl -X POST https://api.scrumooth.dev/api/v1/daily-updates/550e8400-e29b-41d4-a716-446655440000 \
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
curl -X GET https://api.scrumooth.dev/api/v1/daily-updates/update/550e8400-e29b-41d4-a716-446655440010 \
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
curl -X PUT https://api.scrumooth.dev/api/v1/daily-updates/update/550e8400-e29b-41d4-a716-446655440010 \
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
curl -X DELETE https://api.scrumooth.dev/api/v1/daily-updates/update/550e8400-e29b-41d4-a716-446655440010 \
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
curl -X POST https://api.scrumooth.dev/api/v1/daily-updates/550e8400-e29b-41d4-a716-446655440010/promote-impediment \
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
curl -X POST https://api.scrumooth.dev/api/v1/daily-updates/550e8400-e29b-41d4-a716-446655440000/send-reminder \
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
