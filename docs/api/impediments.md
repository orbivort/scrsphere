# Impediments API

Complete Impediments API reference for impediment tracking, status management, and team-level statistics.

## Table of Contents

- [Overview](#overview)
- [Authentication](#authentication)
- [Impediment Statuses](#impediment-statuses)
- [Endpoints](#endpoints)
  - [Get Impediments](#get-impediments)
  - [Get Impediment Statistics](#get-impediment-statistics)
  - [Get Impediment by ID](#get-impediment-by-id)
  - [Create Impediment](#create-impediment)
  - [Update Impediment](#update-impediment)
  - [Delete Impediment](#delete-impediment)
- [Error Codes](#error-codes)
- [Best Practices](#best-practices)

## Overview

The Impediments API provides comprehensive impediment management capabilities including:

- Impediment creation and tracking
- Status lifecycle management (Open, In Progress, Resolved, Closed)
- Team-level impediment statistics
- Owner assignment and notification
- Resolution tracking with timestamps

All endpoints are scoped under `/api/v1/impediments`.

## Authentication

All impediment endpoints require authentication. Include the access token in your request:

**Using Cookies (Recommended)**

```http
GET /api/v1/impediments?teamId=550e8400-e29b-41d4-a716-446655440099
Cookie: accessToken=eyJhbGc...
```

**Using Bearer Token**

```http
GET /api/v1/impediments?teamId=550e8400-e29b-41d4-a716-446655440099
Authorization: Bearer eyJhbGc...
```

## Impediment Statuses

Impediments follow a defined status lifecycle:

| Status          | Description                                                 |
| --------------- | ----------------------------------------------------------- |
| **OPEN**        | Newly reported impediment, not yet being addressed          |
| **IN_PROGRESS** | Someone is actively working on resolving the issue          |
| **RESOLVED**    | The impediment has been resolved (requires resolution text) |
| **CLOSED**      | The impediment is closed and no longer relevant             |

### Status Transitions

```
OPEN -> IN_PROGRESS -> RESOLVED -> CLOSED
  |                      |
  +----------------------+
       (can reopen by changing status)
```

## Endpoints

### Get Impediments

Get all impediments for a specific team, ordered by creation date (newest first).

**Endpoint**

```
GET /api/v1/impediments
```

**Authentication**

- Required

**Query Parameters**

- `teamId` (string, required): Team UUID to filter impediments by

**Success Response**

```http
HTTP/1.1 200 OK
Content-Type: application/json

{
  "success": true,
  "data": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440020",
      "teamId": "550e8400-e29b-41d4-a716-446655440099",
      "sprintId": "550e8400-e29b-41d4-a716-446655440000",
      "title": "API dependency blocking dashboard work",
      "description": "The backend API endpoint for dashboard data is not yet available.",
      "reportedById": "550e8400-e29b-41d4-a716-446655440001",
      "ownerId": "550e8400-e29b-41d4-a716-446655440002",
      "status": "IN_PROGRESS",
      "resolution": null,
      "resolvedAt": null,
      "dailyUpdateId": null,
      "createdAt": "2026-05-10T10:00:00.000Z",
      "createdBy": "550e8400-e29b-41d4-a716-446655440001",
      "updatedAt": "2026-05-10T11:00:00.000Z",
      "updatedBy": null,
      "reportedBy": {
        "id": "550e8400-e29b-41d4-a716-446655440001",
        "firstName": "John",
        "lastName": "Doe",
        "email": "john@example.com"
      },
      "owner": {
        "id": "550e8400-e29b-41d4-a716-446655440002",
        "firstName": "Jane",
        "lastName": "Smith",
        "email": "jane@example.com"
      },
      "sprint": {
        "id": "550e8400-e29b-41d4-a716-446655440000",
        "name": "Sprint 5"
      },
      "dailyUpdate": null
    }
  ]
}
```

**Error Responses**

**400 Bad Request - Missing teamId**

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "teamId is required"
  }
}
```

**Example Request**

```bash
curl -X GET "https://api.scrsphere.dev/api/v1/impediments?teamId=550e8400-e29b-41d4-a716-446655440099" \
  -b cookies.txt
```

---

### Get Impediment Statistics

Get aggregated impediment statistics for a specific team, grouped by status.

**Endpoint**

```
GET /api/v1/impediments/stats
```

**Authentication**

- Required

**Query Parameters**

- `teamId` (string, required): Team UUID to get statistics for

**Success Response**

```http
HTTP/1.1 200 OK
Content-Type: application/json

{
  "success": true,
  "data": {
    "open": 3,
    "inProgress": 2,
    "resolved": 5,
    "closed": 1
  }
}
```

**Error Responses**

**400 Bad Request - Missing teamId**

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "teamId is required"
  }
}
```

**Example Request**

```bash
curl -X GET "https://api.scrsphere.dev/api/v1/impediments/stats?teamId=550e8400-e29b-41d4-a716-446655440099" \
  -b cookies.txt
```

---

### Get Impediment by ID

Get detailed information about a specific impediment.

**Endpoint**

```
GET /api/v1/impediments/:id
```

**Authentication**

- Required

**Path Parameters**

- `id` (string, required): Impediment UUID

**Query Parameters**

- `teamId` (string, required): Team UUID to verify team access

**Success Response**

```http
HTTP/1.1 200 OK
Content-Type: application/json

{
  "success": true,
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440020",
    "teamId": "550e8400-e29b-41d4-a716-446655440099",
    "sprintId": "550e8400-e29b-41d4-a716-446655440000",
    "title": "API dependency blocking dashboard work",
    "description": "The backend API endpoint for dashboard data is not yet available, blocking frontend dashboard development.",
    "reportedById": "550e8400-e29b-41d4-a716-446655440001",
    "ownerId": "550e8400-e29b-41d4-a716-446655440002",
    "status": "IN_PROGRESS",
    "resolution": null,
    "resolvedAt": null,
    "dailyUpdateId": null,
    "createdAt": "2026-05-10T10:00:00.000Z",
    "createdBy": "550e8400-e29b-41d4-a716-446655440001",
    "updatedAt": "2026-05-10T11:00:00.000Z",
    "updatedBy": null,
    "reportedBy": {
      "id": "550e8400-e29b-41d4-a716-446655440001",
      "firstName": "John",
      "lastName": "Doe",
      "email": "john@example.com"
    },
    "owner": {
      "id": "550e8400-e29b-41d4-a716-446655440002",
      "firstName": "Jane",
      "lastName": "Smith",
      "email": "jane@example.com"
    },
    "sprint": {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "name": "Sprint 5"
    },
    "dailyUpdate": null
  }
}
```

**Error Responses**

**400 Bad Request - Missing teamId**

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "teamId is required"
  }
}
```

**404 Not Found**

```json
{
  "success": false,
  "error": {
    "code": "NOT_FOUND",
    "message": "Impediment not found"
  }
}
```

**Example Request**

```bash
curl -X GET "https://api.scrsphere.dev/api/v1/impediments/550e8400-e29b-41d4-a716-446655440020?teamId=550e8400-e29b-41d4-a716-446655440099" \
  -b cookies.txt
```

---

### Create Impediment

Create a new impediment. The authenticated user is automatically set as the reporter. If an owner is assigned and is not the reporter, a notification is sent to the owner.

**Endpoint**

```
POST /api/v1/impediments
```

**Authentication**

- Required

**Request Body**

```json
{
  "teamId": "string (required, team UUID)",
  "sprintId": "string (optional, sprint UUID)",
  "title": "string (required)",
  "description": "string (required)",
  "ownerId": "string (optional, user UUID)"
}
```

**Success Response**

```http
HTTP/1.1 201 Created
Content-Type: application/json

{
  "success": true,
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440020",
    "teamId": "550e8400-e29b-41d4-a716-446655440099",
    "sprintId": "550e8400-e29b-41d4-a716-446655440000",
    "title": "API dependency blocking dashboard work",
    "description": "The backend API endpoint for dashboard data is not yet available, blocking frontend dashboard development.",
    "reportedById": "550e8400-e29b-41d4-a716-446655440001",
    "ownerId": "550e8400-e29b-41d4-a716-446655440002",
    "status": "OPEN",
    "resolution": null,
    "resolvedAt": null,
    "dailyUpdateId": null,
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
    "owner": {
      "id": "550e8400-e29b-41d4-a716-446655440002",
      "firstName": "Jane",
      "lastName": "Smith",
      "email": "jane@example.com"
    },
    "sprint": {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "name": "Sprint 5"
    },
    "dailyUpdate": null
  }
}
```

**Error Responses**

**400 Bad Request - Missing Required Fields**

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "teamId, title, and description are required"
  }
}
```

**Example Request**

```bash
curl -X POST https://api.scrsphere.dev/api/v1/impediments \
  -H "Content-Type: application/json" \
  -b cookies.txt \
  -d '{
    "teamId": "550e8400-e29b-41d4-a716-446655440099",
    "sprintId": "550e8400-e29b-41d4-a716-446655440000",
    "title": "API dependency blocking dashboard work",
    "description": "The backend API endpoint for dashboard data is not yet available, blocking frontend dashboard development.",
    "ownerId": "550e8400-e29b-41d4-a716-446655440002"
  }'
```

---

### Update Impediment

Update an impediment's status, resolution, or owner. When marking an impediment as RESOLVED, a resolution text is required.

**Endpoint**

```
PUT /api/v1/impediments/:id
```

**Authentication**

- Required

**Path Parameters**

- `id` (string, required): Impediment UUID

**Request Body**

```json
{
  "teamId": "string (required, team UUID)",
  "status": "string (optional, one of: OPEN, IN_PROGRESS, RESOLVED, CLOSED)",
  "resolution": "string (optional, required when status is RESOLVED)",
  "ownerId": "string (optional, user UUID)"
}
```

**Success Response**

```http
HTTP/1.1 200 OK
Content-Type: application/json

{
  "success": true,
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440020",
    "teamId": "550e8400-e29b-41d4-a716-446655440099",
    "sprintId": "550e8400-e29b-41d4-a716-446655440000",
    "title": "API dependency blocking dashboard work",
    "description": "The backend API endpoint for dashboard data is not yet available, blocking frontend dashboard development.",
    "reportedById": "550e8400-e29b-41d4-a716-446655440001",
    "ownerId": "550e8400-e29b-41d4-a716-446655440002",
    "status": "RESOLVED",
    "resolution": "Backend API endpoint deployed and verified. Frontend integration complete.",
    "resolvedAt": "2026-05-11T14:00:00.000Z",
    "dailyUpdateId": null,
    "createdAt": "2026-05-10T10:00:00.000Z",
    "createdBy": "550e8400-e29b-41d4-a716-446655440001",
    "updatedAt": "2026-05-11T14:00:00.000Z",
    "updatedBy": null,
    "reportedBy": {
      "id": "550e8400-e29b-41d4-a716-446655440001",
      "firstName": "John",
      "lastName": "Doe",
      "email": "john@example.com"
    },
    "owner": {
      "id": "550e8400-e29b-41d4-a716-446655440002",
      "firstName": "Jane",
      "lastName": "Smith",
      "email": "jane@example.com"
    },
    "sprint": {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "name": "Sprint 5"
    },
    "dailyUpdate": null
  }
}
```

**Error Responses**

**400 Bad Request - Missing teamId**

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "teamId is required"
  }
}
```

**400 Bad Request - Resolution Required**

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Resolution is required when marking impediment as resolved"
  }
}
```

**404 Not Found - Impediment Not Found**

```json
{
  "success": false,
  "error": {
    "code": "NOT_FOUND",
    "message": "Impediment not found"
  }
}
```

**Example Request**

```bash
curl -X PUT https://api.scrsphere.dev/api/v1/impediments/550e8400-e29b-41d4-a716-446655440020 \
  -H "Content-Type: application/json" \
  -b cookies.txt \
  -d '{
    "teamId": "550e8400-e29b-41d4-a716-446655440099",
    "status": "RESOLVED",
    "resolution": "Backend API endpoint deployed and verified. Frontend integration complete."
  }'
```

---

### Delete Impediment

Delete an impediment by ID. Requires team context via query parameter.

**Endpoint**

```
DELETE /api/v1/impediments/:id
```

**Authentication**

- Required

**Path Parameters**

- `id` (string, required): Impediment UUID

**Query Parameters**

- `teamId` (string, required): Team UUID to verify team access

**Success Response**

```http
HTTP/1.1 200 OK
Content-Type: application/json

{
  "success": true,
  "data": {
    "message": "Impediment deleted successfully"
  }
}
```

**Error Responses**

**400 Bad Request - Missing teamId**

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "teamId is required"
  }
}
```

**Example Request**

```bash
curl -X DELETE "https://api.scrsphere.dev/api/v1/impediments/550e8400-e29b-41d4-a716-446655440020?teamId=550e8400-e29b-41d4-a716-446655440099" \
  -b cookies.txt
```

---

## Error Codes

| Code                   | HTTP Status | Description                                          |
| ---------------------- | ----------- | ---------------------------------------------------- |
| `VALIDATION_ERROR`     | 400         | Request validation failed or business rule violation |
| `AUTHENTICATION_ERROR` | 401         | Authentication required                              |
| `AUTHORIZATION_ERROR`  | 403         | Insufficient permissions                             |
| `NOT_FOUND`            | 404         | Impediment not found                                 |

## Best Practices

### Impediment Management

1. **Prompt Reporting**: Report impediments as soon as they are identified to minimize sprint impact
2. **Clear Descriptions**: Provide detailed descriptions that help the team understand the blocker
3. **Owner Assignment**: Assign an owner to each impediment for clear accountability
4. **Resolution Tracking**: Always provide a resolution description when marking an impediment as RESOLVED
5. **Status Updates**: Keep impediment statuses up to date to reflect current progress

### Security

1. **Team Scoping**: All impediment operations require a `teamId` to ensure proper access control
2. **Audit Trail**: Impediment creation and updates are tracked with `createdBy` and `updatedBy` fields
3. **Owner Notifications**: When an owner is assigned during creation, they receive a notification automatically

### Integration Tips

1. **Statistics Dashboard**: Use the `/stats` endpoint to build team-level impediment dashboards
2. **Daily Update Promotion**: Use the [Daily Scrum API](./daily-scrum.md) promote-impediment endpoint to convert daily update impediments into formal records
3. **Sprint Scoping**: Associate impediments with sprints to track blockers within sprint context
4. **Filtering**: Use the `teamId` query parameter consistently to scope results to the current team context

---

**Last Updated**: 2026-05-10

**Related Documentation**

- [Authentication API](./authentication.md)
- [Daily Scrum API](./daily-scrum.md)
- [Sprints API](./sprints.md)
- [Teams API](./teams.md)
