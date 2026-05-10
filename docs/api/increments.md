# Increments API

Complete Increments API reference for product increment management, delivery tracking, and metrics.

## Table of Contents

- [Overview](#overview)
- [Authentication](#authentication)
- [Increment Statuses](#increment-statuses)
- [Endpoints](#endpoints)
  - [Get Increments](#get-increments)
  - [Get Increment Metrics](#get-increment-metrics)
  - [Get Increment by ID](#get-increment-by-id)
  - [Create Increment](#create-increment)
  - [Update Increment](#update-increment)
  - [Deliver Increment](#deliver-increment)
- [Error Codes](#error-codes)
- [Best Practices](#best-practices)

## Overview

The Increments API provides comprehensive product increment management capabilities including:

- Increment creation and configuration
- PBI association and story point tracking
- Increment delivery workflow
- Delivery metrics and analytics
- Status lifecycle management

## Authentication

All increment endpoints require authentication. Include the access token in your request:

**Using Cookies (Recommended)**

```http
GET /api/v1/increments
Cookie: accessToken=eyJhbGc...
```

**Using Bearer Token**

```http
GET /api/v1/increments
Authorization: Bearer eyJhbGc...
```

## Increment Statuses

Increments follow a defined lifecycle from draft through delivery:

```
DRAFT ──► VERIFIED ──► DELIVERED ──► ARCHIVED
  │           │
  │           └──► Return to DRAFT
  └──► Delete
```

| Status      | Description                                             |
| ----------- | ------------------------------------------------------- |
| `DRAFT`     | Increment is being assembled, PBIs can be added/removed |
| `VERIFIED`  | Increment has been verified against Definition of Done  |
| `DELIVERED` | Increment has been delivered to stakeholders            |
| `ARCHIVED`  | Increment is archived for historical reference          |

## Endpoints

### Get Increments

Get all increments for a team, optionally filtered by sprint.

**Endpoint**

```
GET /api/v1/increments
```

**Authentication**

- Required

**Rate Limit**

- 100 requests per 15 minutes

**Query Parameters**

- `teamId` (string, required): Team UUID to filter increments
- `sprintId` (string, optional): Sprint UUID to filter by specific sprint

**Success Response**

```http
HTTP/1.1 200 OK
Content-Type: application/json

{
  "success": true,
  "data": {
    "increments": [
      {
        "id": "550e8400-e29b-41d4-a716-446655440000",
        "name": "Sprint 5 Increment",
        "description": "User authentication and profile features",
        "sprintId": "550e8400-e29b-41d4-a716-446655440001",
        "teamId": "550e8400-e29b-41d4-a716-446655440002",
        "includedPBIs": [
          "550e8400-e29b-41d4-a716-446655440003",
          "550e8400-e29b-41d4-a716-446655440004"
        ],
        "totalStoryPoints": 21,
        "status": "DRAFT",
        "createdBy": "550e8400-e29b-41d4-a716-446655440005",
        "createdAt": "2026-04-29T12:00:00.000Z",
        "updatedAt": "2026-04-29T12:00:00.000Z"
      }
    ]
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
curl -X GET "https://api.scrsphere.dev/api/v1/increments?teamId=550e8400-e29b-41d4-a716-446655440002" \
  -b cookies.txt
```

---

### Get Increment Metrics

Get aggregated increment delivery metrics for a team.

**Endpoint**

```
GET /api/v1/increments/metrics
```

**Authentication**

- Required

**Rate Limit**

- 100 requests per 15 minutes

**Query Parameters**

- `teamId` (string, required): Team UUID

**Success Response**

```http
HTTP/1.1 200 OK
Content-Type: application/json

{
  "success": true,
  "data": {
    "metrics": {
      "totalIncrements": 12,
      "deliveredIncrements": 10,
      "averageStoryPoints": 18.5,
      "deliveryRate": 0.83
    }
  }
}
```

**Example Request**

```bash
curl -X GET "https://api.scrsphere.dev/api/v1/increments/metrics?teamId=550e8400-e29b-41d4-a716-446655440002" \
  -b cookies.txt
```

---

### Get Increment by ID

Get detailed information about a specific increment.

**Endpoint**

```
GET /api/v1/increments/:id
```

**Authentication**

- Required

**Rate Limit**

- 100 requests per 15 minutes

**Path Parameters**

- `id` (string, required): Increment UUID

**Success Response**

```http
HTTP/1.1 200 OK
Content-Type: application/json

{
  "success": true,
  "data": {
    "increment": {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "name": "Sprint 5 Increment",
      "description": "User authentication and profile features",
      "sprintId": "550e8400-e29b-41d4-a716-446655440001",
      "teamId": "550e8400-e29b-41d4-a716-446655440002",
      "includedPBIs": [
        "550e8400-e29b-41d4-a716-446655440003",
        "550e8400-e29b-41d4-a716-446655440004"
      ],
      "totalStoryPoints": 21,
      "status": "VERIFIED",
      "createdBy": "550e8400-e29b-41d4-a716-446655440005",
      "createdAt": "2026-04-29T12:00:00.000Z",
      "updatedAt": "2026-04-30T09:00:00.000Z"
    }
  }
}
```

**Error Responses**

**404 Not Found**

```json
{
  "success": false,
  "error": {
    "code": "NOT_FOUND",
    "message": "Increment not found"
  }
}
```

**Example Request**

```bash
curl -X GET https://api.scrsphere.dev/api/v1/increments/550e8400-e29b-41d4-a716-446655440000 \
  -b cookies.txt
```

---

### Create Increment

Create a new product increment associated with a sprint.

**Endpoint**

```
POST /api/v1/increments
```

**Authentication**

- Required
- Scrum Master role recommended

**Rate Limit**

- 100 requests per 15 minutes

**Request Body**

```json
{
  "name": "string (1-200 chars, required)",
  "description": "string (max 2000 chars, optional)",
  "sprintId": "string (UUID, required)",
  "teamId": "string (UUID, required)",
  "includedPBIs": ["string (UUID)"],
  "totalStoryPoints": "number (integer >= 0, default: 0)",
  "status": "string (DRAFT|VERIFIED|DELIVERED|ARCHIVED, default: DRAFT)",
  "createdBy": "string (UUID, optional)"
}
```

**Validation Rules**

- `name`: 1-200 characters, required
- `description`: Maximum 2000 characters, optional
- `sprintId`: Valid UUID, required
- `teamId`: Valid UUID, required
- `includedPBIs`: Array of valid UUIDs, defaults to empty array
- `totalStoryPoints`: Non-negative integer, defaults to 0
- `status`: One of `DRAFT`, `VERIFIED`, `DELIVERED`, `ARCHIVED`, defaults to `DRAFT`

**Success Response**

```http
HTTP/1.1 201 Created
Content-Type: application/json

{
  "success": true,
  "data": {
    "increment": {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "name": "Sprint 5 Increment",
      "description": "User authentication and profile features",
      "sprintId": "550e8400-e29b-41d4-a716-446655440001",
      "teamId": "550e8400-e29b-41d4-a716-446655440002",
      "includedPBIs": [
        "550e8400-e29b-41d4-a716-446655440003"
      ],
      "totalStoryPoints": 13,
      "status": "DRAFT",
      "createdBy": "550e8400-e29b-41d4-a716-446655440005",
      "createdAt": "2026-04-29T12:00:00.000Z",
      "updatedAt": "2026-04-29T12:00:00.000Z"
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
        "field": "name",
        "message": "Name is required"
      }
    ]
  }
}
```

**409 Conflict - Sprint Already Has Increment**

```json
{
  "success": false,
  "error": {
    "code": "CONFLICT",
    "message": "An increment already exists for this sprint"
  }
}
```

**Example Request**

```bash
curl -X POST https://api.scrsphere.dev/api/v1/increments \
  -H "Content-Type: application/json" \
  -b cookies.txt \
  -d '{
    "name": "Sprint 5 Increment",
    "description": "User authentication and profile features",
    "sprintId": "550e8400-e29b-41d4-a716-446655440001",
    "teamId": "550e8400-e29b-41d4-a716-446655440002",
    "includedPBIs": [
      "550e8400-e29b-41d4-a716-446655440003"
    ],
    "totalStoryPoints": 13
  }'
```

---

### Update Increment

Update an existing increment's details, PBIs, or status.

**Endpoint**

```
PUT /api/v1/increments/:id
```

**Authentication**

- Required
- Scrum Master role recommended

**Rate Limit**

- 100 requests per 15 minutes

**Path Parameters**

- `id` (string, required): Increment UUID

**Request Body**

```json
{
  "name": "string (1-200 chars, optional)",
  "description": "string (max 2000 chars, optional)",
  "includedPBIs": ["string (UUID)"],
  "totalStoryPoints": "number (integer >= 0, optional)",
  "status": "string (DRAFT|VERIFIED|DELIVERED|ARCHIVED, optional)"
}
```

**Success Response**

```http
HTTP/1.1 200 OK
Content-Type: application/json

{
  "success": true,
  "data": {
    "increment": {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "name": "Sprint 5 Increment - Updated",
      "description": "Updated description",
      "sprintId": "550e8400-e29b-41d4-a716-446655440001",
      "teamId": "550e8400-e29b-41d4-a716-446655440002",
      "includedPBIs": [
        "550e8400-e29b-41d4-a716-446655440003",
        "550e8400-e29b-41d4-a716-446655440004"
      ],
      "totalStoryPoints": 21,
      "status": "VERIFIED",
      "updatedAt": "2026-04-30T09:00:00.000Z"
    }
  }
}
```

**Error Responses**

**404 Not Found**

```json
{
  "success": false,
  "error": {
    "code": "NOT_FOUND",
    "message": "Increment not found"
  }
}
```

**Example Request**

```bash
curl -X PUT https://api.scrsphere.dev/api/v1/increments/550e8400-e29b-41d4-a716-446655440000 \
  -H "Content-Type: application/json" \
  -b cookies.txt \
  -d '{
    "name": "Sprint 5 Increment - Updated",
    "status": "VERIFIED",
    "totalStoryPoints": 21
  }'
```

---

### Deliver Increment

Mark an increment as delivered, recording the delivery method and optional notes.

**Endpoint**

```
POST /api/v1/increments/:id/deliver
```

**Authentication**

- Required
- Scrum Master role recommended

**Rate Limit**

- 100 requests per 15 minutes

**Path Parameters**

- `id` (string, required): Increment UUID

**Request Body**

```json
{
  "deliveryMethod": "string (sprint_review|early_release, required)",
  "notes": "string (max 2000 chars, optional)"
}
```

**Validation Rules**

- `deliveryMethod`: Must be one of `sprint_review` or `early_release`, required
- `notes`: Maximum 2000 characters, optional

**Success Response**

```http
HTTP/1.1 200 OK
Content-Type: application/json

{
  "success": true,
  "data": {
    "increment": {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "name": "Sprint 5 Increment",
      "status": "DELIVERED",
      "updatedAt": "2026-04-30T14:00:00.000Z"
    },
    "delivery": {
      "incrementId": "550e8400-e29b-41d4-a716-446655440000",
      "deliveryMethod": "sprint_review",
      "notes": "Delivered during Sprint 5 review meeting",
      "deliveredAt": "2026-04-30T14:00:00.000Z"
    }
  }
}
```

**Error Responses**

**400 Bad Request - Invalid Delivery Method**

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid delivery method. Must be sprint_review or early_release"
  }
}
```

**409 Conflict - Already Delivered**

```json
{
  "success": false,
  "error": {
    "code": "CONFLICT",
    "message": "Increment has already been delivered"
  }
}
```

**Example Request**

```bash
curl -X POST https://api.scrsphere.dev/api/v1/increments/550e8400-e29b-41d4-a716-446655440000/deliver \
  -H "Content-Type: application/json" \
  -b cookies.txt \
  -d '{
    "deliveryMethod": "sprint_review",
    "notes": "Delivered during Sprint 5 review meeting"
  }'
```

---

## Error Codes

| Code                   | HTTP Status | Description                                                      |
| ---------------------- | ----------- | ---------------------------------------------------------------- |
| `VALIDATION_ERROR`     | 400         | Request validation failed                                        |
| `AUTHENTICATION_ERROR` | 401         | Authentication required                                          |
| `AUTHORIZATION_ERROR`  | 403         | Insufficient permissions                                         |
| `NOT_FOUND`            | 404         | Increment not found                                              |
| `CONFLICT`             | 409         | Resource conflict (e.g., duplicate increment, already delivered) |

## Best Practices

### Increment Management

1. **Create Early**: Create increments at the start of each sprint to track delivery from the beginning
2. **Associate PBIs**: Link all completed PBIs to the increment for accurate tracking
3. **Verify Before Delivery**: Use the DoD compliance check before marking an increment as delivered
4. **Track Story Points**: Keep totalStoryPoints updated as PBIs are added or removed

### Delivery Workflow

1. **Sprint Review Delivery**: The standard delivery method during sprint review meetings
2. **Early Release**: Use for increments that can be delivered before the sprint review
3. **Document Notes**: Always include delivery notes for audit trail and team reference
4. **Archive Completed**: Archive delivered increments after the retrospective to keep the list clean

### Metrics

1. **Monitor Delivery Rate**: Track the ratio of delivered vs total increments over time
2. **Story Point Trends**: Use averageStoryPoints to forecast future sprint capacity
3. **Team Comparison**: Compare metrics across teams to identify improvement opportunities

---

**Last Updated**: 2026-05-10

**Related Documentation**

- [Sprints API](./sprints.md)
- [Sprint Reviews API](./sprint-reviews.md)
- [Product Backlog API](./product-backlog.md)
- [Definition of Done API](./definition-of-done.md)
- [Reports API](./reports.md)
