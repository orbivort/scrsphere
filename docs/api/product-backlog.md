# Product Backlog API

Complete Product Backlog API reference for managing product backlog items (PBIs), prioritization, reordering, and Definition of Done/Ready verification.

## Table of Contents

- [Overview](#overview)
- [Authentication](#authentication)
- [PBI Statuses](#pbi-statuses)
- [MoSCoW Prioritization](#moscow-prioritization)
- [Endpoints](#endpoints)
  - [Get Product Backlog](#get-product-backlog)
  - [Create PBI](#create-pbi)
  - [Get PBI by ID](#get-pbi-by-id)
  - [Update PBI](#update-pbi)
  - [Update PBI Priority](#update-pbi-priority)
  - [Delete PBI](#delete-pbi)
  - [Get Tasks for PBI](#get-tasks-for-pbi)
  - [Reorder PBIs](#reorder-pbis)
  - [Verify Definition of Done](#verify-definition-of-done)
  - [Get DoD Verifications](#get-dod-verifications)
  - [Verify Definition of Ready](#verify-definition-of-ready)
  - [Get DoR Verifications](#get-dor-verifications)
- [Error Codes](#error-codes)
- [Best Practices](#best-practices)

## Overview

The Product Backlog API provides comprehensive product backlog management capabilities including:

- Product backlog item (PBI) creation and management
- MoSCoW prioritization (MUST_HAVE, SHOULD_HAVE, COULD_HAVE, WONT_HAVE)
- PBI reordering within the backlog
- Definition of Done (DoD) verification tracking
- Definition of Ready (DoR) verification tracking
- Task association with backlog items
- Label-based categorization and filtering

## Authentication

All product backlog endpoints require authentication. Include the access token in your request:

**Using Cookies (Recommended)**

```http
GET /api/v1/product-backlog
Cookie: accessToken=eyJhbGc...
```

**Using Bearer Token**

```http
GET /api/v1/product-backlog
Authorization: Bearer eyJhbGc...
```

## PBI Statuses

Product backlog items follow a defined lifecycle with five statuses:

| Status          | Description                                         |
| --------------- | --------------------------------------------------- |
| **NEW**         | Item has been created but not yet refined           |
| **REFINED**     | Item has been discussed and details clarified       |
| **READY**       | Item meets Definition of Ready and can be pulled in |
| **IN_PROGRESS** | Item is currently being worked on in a sprint       |
| **DONE**        | Item meets Definition of Done and is complete       |

### Status Flow

```
NEW ──→ REFINED ──→ READY ──→ IN_PROGRESS ──→ DONE
```

## MoSCoW Prioritization

The product backlog uses the MoSCoW method for prioritization:

| Priority        | Description                                            |
| --------------- | ------------------------------------------------------ |
| **MUST_HAVE**   | Critical items required for success                    |
| **SHOULD_HAVE** | Important but not critical; can be deferred            |
| **COULD_HAVE**  | Desirable but not necessary; nice to have              |
| **WONT_HAVE**   | Not planned for current iteration; explicitly excluded |

## Endpoints

### Get Product Backlog

Get all product backlog items for a team with filtering and pagination.

**Endpoint**

```
GET /api/v1/product-backlog
```

**Authentication**

- Required

**Rate Limit**

- 100 requests per 15 minutes

**Query Parameters**

- `teamId` (string, required): Team UUID to filter items by
- `status` (string, optional): Filter by status - one of: NEW, REFINED, READY, IN_PROGRESS, DONE
- `labels` (string, optional): Filter by labels (comma-separated)
- `page` (integer, optional): Page number (default: 1)
- `limit` (integer, optional): Items per page (default: 20, max: 100)

**Success Response**

```http
HTTP/1.1 200 OK
Content-Type: application/json

{
  "success": true,
  "data": {
    "items": [
      {
        "id": "880e8400-e29b-41d4-a716-446655440000",
        "teamId": "550e8400-e29b-41d4-a716-446655440000",
        "goalId": "660e8400-e29b-41d4-a716-446655440000",
        "title": "User registration with email verification",
        "description": "As a new user, I want to register with email verification so that my account is secure.",
        "storyPoints": 5,
        "priority": "MUST_HAVE",
        "businessValue": 90,
        "labels": ["auth", "security"],
        "acceptanceCriteria": "1. User can register with email\n2. Verification email is sent\n3. Account is activated after verification",
        "status": "READY",
        "order": 1,
        "createdBy": "550e8400-e29b-41d4-a716-446655440001",
        "createdAt": "2026-04-29T12:00:00.000Z",
        "updatedAt": "2026-04-29T12:00:00.000Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 1,
      "totalPages": 1,
      "hasNext": false,
      "hasPrev": false
    }
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
    "message": "Validation failed",
    "details": [
      {
        "field": "teamId",
        "message": "teamId is required"
      }
    ]
  }
}
```

**Example Request**

```bash
curl -X GET "https://api.scrsphere.dev/api/v1/product-backlog?teamId=550e8400-e29b-41d4-a716-446655440000&status=READY&limit=10" \
  -b cookies.txt
```

---

### Create PBI

Create a new product backlog item. Requires Product Owner role.

**Endpoint**

```
POST /api/v1/product-backlog
```

**Authentication**

- Required
- Product Owner role required

**Rate Limit**

- 100 requests per 15 minutes

**Request Body**

```json
{
  "teamId": "string (required, UUID)",
  "goalId": "string (optional, UUID)",
  "title": "string (required, 1-200 chars)",
  "description": "string (optional, max 5000 chars)",
  "storyPoints": "integer (optional, 1-100)",
  "priority": "string (optional, one of: MUST_HAVE, SHOULD_HAVE, COULD_HAVE, WONT_HAVE)",
  "businessValue": "integer (optional, 1-100)",
  "labels": "string[] (optional)",
  "acceptanceCriteria": "string (optional, max 5000 chars)",
  "status": "string (optional, one of: NEW, REFINED, READY, IN_PROGRESS, DONE)"
}
```

**Validation Rules**

- `teamId`: Required, must be a valid UUID
- `goalId`: Optional, must be a valid UUID if provided
- `title`: Required, must be between 1 and 200 characters
- `description`: Optional, maximum 5000 characters
- `storyPoints`: Optional, must be between 1 and 100
- `priority`: Optional, defaults to `SHOULD_HAVE` if not provided
- `businessValue`: Optional, must be between 1 and 100
- `labels`: Optional, array of strings
- `acceptanceCriteria`: Optional, maximum 5000 characters
- `status`: Optional, defaults to `NEW` if not provided

**Success Response**

```http
HTTP/1.1 201 Created
Content-Type: application/json

{
  "success": true,
  "data": {
    "item": {
      "id": "880e8400-e29b-41d4-a716-446655440000",
      "teamId": "550e8400-e29b-41d4-a716-446655440000",
      "goalId": "660e8400-e29b-41d4-a716-446655440000",
      "title": "User registration with email verification",
      "description": "As a new user, I want to register with email verification so that my account is secure.",
      "storyPoints": 5,
      "priority": "MUST_HAVE",
      "businessValue": 90,
      "labels": ["auth", "security"],
      "acceptanceCriteria": "1. User can register with email\n2. Verification email is sent\n3. Account is activated after verification",
      "status": "NEW",
      "order": 1,
      "createdBy": "550e8400-e29b-41d4-a716-446655440001",
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
        "field": "title",
        "message": "Title is required"
      }
    ]
  }
}
```

**403 Forbidden - Insufficient Permissions**

```json
{
  "success": false,
  "error": {
    "code": "AUTHORIZATION_ERROR",
    "message": "Product Owner role required"
  }
}
```

**Example Request**

```bash
curl -X POST https://api.scrsphere.dev/api/v1/product-backlog \
  -H "Content-Type: application/json" \
  -b cookies.txt \
  -d '{
    "teamId": "550e8400-e29b-41d4-a716-446655440000",
    "goalId": "660e8400-e29b-41d4-a716-446655440000",
    "title": "User registration with email verification",
    "description": "As a new user, I want to register with email verification so that my account is secure.",
    "storyPoints": 5,
    "priority": "MUST_HAVE",
    "businessValue": 90,
    "labels": ["auth", "security"],
    "acceptanceCriteria": "1. User can register with email\n2. Verification email is sent\n3. Account is activated after verification"
  }'
```

---

### Get PBI by ID

Get detailed information about a specific product backlog item.

**Endpoint**

```
GET /api/v1/product-backlog/:id
```

**Authentication**

- Required

**Rate Limit**

- 100 requests per 15 minutes

**Path Parameters**

- `id` (string, required): Product backlog item UUID

**Success Response**

```http
HTTP/1.1 200 OK
Content-Type: application/json

{
  "success": true,
  "data": {
    "item": {
      "id": "880e8400-e29b-41d4-a716-446655440000",
      "teamId": "550e8400-e29b-41d4-a716-446655440000",
      "goalId": "660e8400-e29b-41d4-a716-446655440000",
      "title": "User registration with email verification",
      "description": "As a new user, I want to register with email verification so that my account is secure.",
      "storyPoints": 5,
      "priority": "MUST_HAVE",
      "businessValue": 90,
      "labels": ["auth", "security"],
      "acceptanceCriteria": "1. User can register with email\n2. Verification email is sent\n3. Account is activated after verification",
      "status": "READY",
      "order": 1,
      "createdBy": "550e8400-e29b-41d4-a716-446655440001",
      "createdAt": "2026-04-29T12:00:00.000Z",
      "updatedAt": "2026-04-29T12:00:00.000Z"
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
    "message": "Product backlog item not found"
  }
}
```

**Example Request**

```bash
curl -X GET https://api.scrsphere.dev/api/v1/product-backlog/880e8400-e29b-41d4-a716-446655440000 \
  -b cookies.txt
```

---

### Update PBI

Update a product backlog item. Requires Product Owner role.

**Endpoint**

```
PUT /api/v1/product-backlog/:id
```

**Authentication**

- Required
- Product Owner role required

**Rate Limit**

- 100 requests per 15 minutes

**Path Parameters**

- `id` (string, required): Product backlog item UUID

**Request Body**

```json
{
  "goalId": "string (optional, UUID)",
  "title": "string (optional, 1-200 chars)",
  "description": "string (optional, max 5000 chars)",
  "storyPoints": "integer (optional, 1-100)",
  "priority": "string (optional, one of: MUST_HAVE, SHOULD_HAVE, COULD_HAVE, WONT_HAVE)",
  "businessValue": "integer (optional, 1-100)",
  "labels": "string[] (optional)",
  "acceptanceCriteria": "string (optional, max 5000 chars)",
  "status": "string (optional, one of: NEW, REFINED, READY, IN_PROGRESS, DONE)"
}
```

**Validation Rules**

- `goalId`: Optional, must be a valid UUID if provided
- `title`: Optional, must be between 1 and 200 characters if provided
- `description`: Optional, maximum 5000 characters
- `storyPoints`: Optional, must be between 1 and 100
- `priority`: Optional, must be a valid MoSCoW value
- `businessValue`: Optional, must be between 1 and 100
- `labels`: Optional, array of strings
- `acceptanceCriteria`: Optional, maximum 5000 characters
- `status`: Optional, must be a valid status value

**Success Response**

```http
HTTP/1.1 200 OK
Content-Type: application/json

{
  "success": true,
  "data": {
    "item": {
      "id": "880e8400-e29b-41d4-a716-446655440000",
      "teamId": "550e8400-e29b-41d4-a716-446655440000",
      "goalId": "660e8400-e29b-41d4-a716-446655440000",
      "title": "User registration with email verification",
      "description": "Updated description with additional context.",
      "storyPoints": 8,
      "priority": "MUST_HAVE",
      "businessValue": 95,
      "labels": ["auth", "security", "onboarding"],
      "acceptanceCriteria": "1. User can register with email\n2. Verification email is sent\n3. Account is activated after verification\n4. Resend verification option available",
      "status": "REFINED",
      "order": 1,
      "createdBy": "550e8400-e29b-41d4-a716-446655440001",
      "createdAt": "2026-04-29T12:00:00.000Z",
      "updatedAt": "2026-04-29T13:00:00.000Z"
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
        "field": "storyPoints",
        "message": "Story points must be between 1 and 100"
      }
    ]
  }
}
```

**403 Forbidden - Insufficient Permissions**

```json
{
  "success": false,
  "error": {
    "code": "AUTHORIZATION_ERROR",
    "message": "Product Owner role required"
  }
}
```

**404 Not Found**

```json
{
  "success": false,
  "error": {
    "code": "NOT_FOUND",
    "message": "Product backlog item not found"
  }
}
```

**Example Request**

```bash
curl -X PUT https://api.scrsphere.dev/api/v1/product-backlog/880e8400-e29b-41d4-a716-446655440000 \
  -H "Content-Type: application/json" \
  -b cookies.txt \
  -d '{
    "description": "Updated description with additional context.",
    "storyPoints": 8,
    "businessValue": 95,
    "labels": ["auth", "security", "onboarding"],
    "status": "REFINED"
  }'
```

---

### Update PBI Priority

Update the priority of a product backlog item. Requires Product Owner role.

**Endpoint**

```
PUT /api/v1/product-backlog/:id/priority
```

**Authentication**

- Required
- Product Owner role required

**Rate Limit**

- 100 requests per 15 minutes

**Path Parameters**

- `id` (string, required): Product backlog item UUID

**Request Body**

```json
{
  "priority": "string (required, one of: MUST_HAVE, SHOULD_HAVE, COULD_HAVE, WONT_HAVE)"
}
```

**Validation Rules**

- `priority`: Required, must be one of: MUST_HAVE, SHOULD_HAVE, COULD_HAVE, WONT_HAVE

**Success Response**

```http
HTTP/1.1 200 OK
Content-Type: application/json

{
  "success": true,
  "data": {
    "item": {
      "id": "880e8400-e29b-41d4-a716-446655440000",
      "teamId": "550e8400-e29b-41d4-a716-446655440000",
      "title": "User registration with email verification",
      "priority": "MUST_HAVE",
      "status": "READY",
      "updatedAt": "2026-04-29T14:00:00.000Z"
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
        "field": "priority",
        "message": "Priority must be one of: MUST_HAVE, SHOULD_HAVE, COULD_HAVE, WONT_HAVE"
      }
    ]
  }
}
```

**403 Forbidden - Insufficient Permissions**

```json
{
  "success": false,
  "error": {
    "code": "AUTHORIZATION_ERROR",
    "message": "Product Owner role required"
  }
}
```

**404 Not Found**

```json
{
  "success": false,
  "error": {
    "code": "NOT_FOUND",
    "message": "Product backlog item not found"
  }
}
```

**Example Request**

```bash
curl -X PUT https://api.scrsphere.dev/api/v1/product-backlog/880e8400-e29b-41d4-a716-446655440000/priority \
  -H "Content-Type: application/json" \
  -b cookies.txt \
  -d '{
    "priority": "MUST_HAVE"
  }'
```

---

### Delete PBI

Delete a product backlog item. Requires Product Owner role. This action is irreversible.

**Endpoint**

```
DELETE /api/v1/product-backlog/:id
```

**Authentication**

- Required
- Product Owner role required

**Rate Limit**

- 100 requests per 15 minutes

**Path Parameters**

- `id` (string, required): Product backlog item UUID

**Success Response**

```http
HTTP/1.1 200 OK
Content-Type: application/json

{
  "success": true,
  "data": {
    "message": "Product backlog item deleted successfully"
  }
}
```

**Error Responses**

**403 Forbidden - Insufficient Permissions**

```json
{
  "success": false,
  "error": {
    "code": "AUTHORIZATION_ERROR",
    "message": "Product Owner role required"
  }
}
```

**404 Not Found**

```json
{
  "success": false,
  "error": {
    "code": "NOT_FOUND",
    "message": "Product backlog item not found"
  }
}
```

**Example Request**

```bash
curl -X DELETE https://api.scrsphere.dev/api/v1/product-backlog/880e8400-e29b-41d4-a716-446655440000 \
  -b cookies.txt
```

---

### Get Tasks for PBI

Get all tasks associated with a product backlog item.

**Endpoint**

```
GET /api/v1/product-backlog/:id/tasks
```

**Authentication**

- Required

**Rate Limit**

- 100 requests per 15 minutes

**Path Parameters**

- `id` (string, required): Product backlog item UUID

**Success Response**

```http
HTTP/1.1 200 OK
Content-Type: application/json

{
  "success": true,
  "data": {
    "tasks": [
      {
        "id": "990e8400-e29b-41d4-a716-446655440001",
        "pbiId": "880e8400-e29b-41d4-a716-446655440000",
        "title": "Create registration form component",
        "description": "Build the registration form with email and password fields",
        "status": "DONE",
        "assigneeId": "550e8400-e29b-41d4-a716-446655440002",
        "createdAt": "2026-04-29T12:00:00.000Z",
        "updatedAt": "2026-04-30T09:00:00.000Z"
      },
      {
        "id": "990e8400-e29b-41d4-a716-446655440002",
        "pbiId": "880e8400-e29b-41d4-a716-446655440000",
        "title": "Implement email verification service",
        "description": "Set up email verification token generation and validation",
        "status": "IN_PROGRESS",
        "assigneeId": "550e8400-e29b-41d4-a716-446655440003",
        "createdAt": "2026-04-29T12:00:00.000Z",
        "updatedAt": "2026-04-29T15:00:00.000Z"
      }
    ]
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
    "message": "Product backlog item not found"
  }
}
```

**Example Request**

```bash
curl -X GET https://api.scrsphere.dev/api/v1/product-backlog/880e8400-e29b-41d4-a716-446655440000/tasks \
  -b cookies.txt
```

---

### Reorder PBIs

Reorder product backlog items within the backlog. Requires Product Owner role.

**Endpoint**

```
POST /api/v1/product-backlog/reorder
```

**Authentication**

- Required
- Product Owner role required

**Rate Limit**

- 100 requests per 15 minutes

**Request Body**

```json
{
  "pbiIds": ["string (required, UUID array)"]
}
```

**Validation Rules**

- `pbiIds`: Required, must be an array of valid UUIDs
- All items must belong to the same team
- All items must exist in the product backlog

**Success Response**

```http
HTTP/1.1 200 OK
Content-Type: application/json

{
  "success": true,
  "data": {
    "items": [
      {
        "id": "880e8400-e29b-41d4-a716-446655440000",
        "title": "User registration with email verification",
        "priority": "MUST_HAVE",
        "order": 1,
        "updatedAt": "2026-04-29T16:00:00.000Z"
      },
      {
        "id": "880e8400-e29b-41d4-a716-446655440001",
        "title": "Password reset functionality",
        "priority": "SHOULD_HAVE",
        "order": 2,
        "updatedAt": "2026-04-29T16:00:00.000Z"
      },
      {
        "id": "880e8400-e29b-41d4-a716-446655440002",
        "title": "Social login integration",
        "priority": "COULD_HAVE",
        "order": 3,
        "updatedAt": "2026-04-29T16:00:00.000Z"
      }
    ]
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
        "field": "pbiIds",
        "message": "pbiIds must be a non-empty array of UUIDs"
      }
    ]
  }
}
```

**403 Forbidden - Insufficient Permissions**

```json
{
  "success": false,
  "error": {
    "code": "AUTHORIZATION_ERROR",
    "message": "Product Owner role required"
  }
}
```

**Example Request**

```bash
curl -X POST https://api.scrsphere.dev/api/v1/product-backlog/reorder \
  -H "Content-Type: application/json" \
  -b cookies.txt \
  -d '{
    "pbiIds": [
      "880e8400-e29b-41d4-a716-446655440000",
      "880e8400-e29b-41d4-a716-446655440001",
      "880e8400-e29b-41d4-a716-446655440002"
    ]
  }'
```

---

### Verify Definition of Done

Verify Definition of Done checklist items for a product backlog item. Requires Scrum Master role.

**Endpoint**

```
POST /api/v1/product-backlog/:id/verify-dod
```

**Authentication**

- Required
- Scrum Master role required

**Rate Limit**

- 100 requests per 15 minutes

**Path Parameters**

- `id` (string, required): Product backlog item UUID

**Request Body**

```json
{
  "verifications": [
    {
      "dodItemId": "string (required, UUID)",
      "isVerified": "boolean (required)",
      "notes": "string (optional)"
    }
  ]
}
```

**Validation Rules**

- `verifications`: Required, must be a non-empty array
- `dodItemId`: Required, must be a valid UUID referencing a DoD item
- `isVerified`: Required, boolean indicating verification status
- `notes`: Optional, string with additional context

**Success Response**

```http
HTTP/1.1 200 OK
Content-Type: application/json

{
  "success": true,
  "data": {
    "verifications": [
      {
        "id": "aa0e8400-e29b-41d4-a716-446655440001",
        "pbiId": "880e8400-e29b-41d4-a716-446655440000",
        "dodItemId": "bb0e8400-e29b-41d4-a716-446655440001",
        "isVerified": true,
        "notes": "All unit tests passing with 95% coverage",
        "verifiedBy": "550e8400-e29b-41d4-a716-446655440001",
        "verifiedAt": "2026-04-29T17:00:00.000Z"
      },
      {
        "id": "aa0e8400-e29b-41d4-a716-446655440002",
        "pbiId": "880e8400-e29b-41d4-a716-446655440000",
        "dodItemId": "bb0e8400-e29b-41d4-a716-446655440002",
        "isVerified": false,
        "notes": "Code review still pending",
        "verifiedBy": "550e8400-e29b-41d4-a716-446655440001",
        "verifiedAt": "2026-04-29T17:00:00.000Z"
      }
    ]
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
        "field": "verifications",
        "message": "verifications must be a non-empty array"
      }
    ]
  }
}
```

**403 Forbidden - Insufficient Permissions**

```json
{
  "success": false,
  "error": {
    "code": "AUTHORIZATION_ERROR",
    "message": "Scrum Master role required"
  }
}
```

**404 Not Found**

```json
{
  "success": false,
  "error": {
    "code": "NOT_FOUND",
    "message": "Product backlog item not found"
  }
}
```

**Example Request**

```bash
curl -X POST https://api.scrsphere.dev/api/v1/product-backlog/880e8400-e29b-41d4-a716-446655440000/verify-dod \
  -H "Content-Type: application/json" \
  -b cookies.txt \
  -d '{
    "verifications": [
      {
        "dodItemId": "bb0e8400-e29b-41d4-a716-446655440001",
        "isVerified": true,
        "notes": "All unit tests passing with 95% coverage"
      },
      {
        "dodItemId": "bb0e8400-e29b-41d4-a716-446655440002",
        "isVerified": false,
        "notes": "Code review still pending"
      }
    ]
  }'
```

---

### Get DoD Verifications

Get all Definition of Done verifications for a product backlog item.

**Endpoint**

```
GET /api/v1/product-backlog/:id/dod-verifications
```

**Authentication**

- Required

**Rate Limit**

- 100 requests per 15 minutes

**Path Parameters**

- `id` (string, required): Product backlog item UUID

**Success Response**

```http
HTTP/1.1 200 OK
Content-Type: application/json

{
  "success": true,
  "data": {
    "verifications": [
      {
        "id": "aa0e8400-e29b-41d4-a716-446655440001",
        "pbiId": "880e8400-e29b-41d4-a716-446655440000",
        "dodItemId": "bb0e8400-e29b-41d4-a716-446655440001",
        "dodItem": {
          "id": "bb0e8400-e29b-41d4-a716-446655440001",
          "title": "Unit tests written and passing",
          "description": "All code must have unit tests with adequate coverage"
        },
        "isVerified": true,
        "notes": "All unit tests passing with 95% coverage",
        "verifiedBy": "550e8400-e29b-41d4-a716-446655440001",
        "verifiedAt": "2026-04-29T17:00:00.000Z"
      },
      {
        "id": "aa0e8400-e29b-41d4-a716-446655440002",
        "pbiId": "880e8400-e29b-41d4-a716-446655440000",
        "dodItemId": "bb0e8400-e29b-41d4-a716-446655440002",
        "dodItem": {
          "id": "bb0e8400-e29b-41d4-a716-446655440002",
          "title": "Code review completed",
          "description": "All code must be reviewed by at least one other developer"
        },
        "isVerified": false,
        "notes": "Code review still pending",
        "verifiedBy": "550e8400-e29b-41d4-a716-446655440001",
        "verifiedAt": "2026-04-29T17:00:00.000Z"
      }
    ]
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
    "message": "Product backlog item not found"
  }
}
```

**Example Request**

```bash
curl -X GET https://api.scrsphere.dev/api/v1/product-backlog/880e8400-e29b-41d4-a716-446655440000/dod-verifications \
  -b cookies.txt
```

---

### Verify Definition of Ready

Verify Definition of Ready checklist items for a product backlog item. Requires Scrum Master role.

**Endpoint**

```
POST /api/v1/product-backlog/:id/verify-dor
```

**Authentication**

- Required
- Scrum Master role required

**Rate Limit**

- 100 requests per 15 minutes

**Path Parameters**

- `id` (string, required): Product backlog item UUID

**Request Body**

```json
{
  "verifications": [
    {
      "dorItemId": "string (required, UUID)",
      "isVerified": "boolean (required)",
      "notes": "string (optional)"
    }
  ]
}
```

**Validation Rules**

- `verifications`: Required, must be a non-empty array
- `dorItemId`: Required, must be a valid UUID referencing a DoR item
- `isVerified`: Required, boolean indicating verification status
- `notes`: Optional, string with additional context

**Success Response**

```http
HTTP/1.1 200 OK
Content-Type: application/json

{
  "success": true,
  "data": {
    "verifications": [
      {
        "id": "cc0e8400-e29b-41d4-a716-446655440001",
        "pbiId": "880e8400-e29b-41d4-a716-446655440000",
        "dorItemId": "dd0e8400-e29b-41d4-a716-446655440001",
        "isVerified": true,
        "notes": "Acceptance criteria clearly defined",
        "verifiedBy": "550e8400-e29b-41d4-a716-446655440001",
        "verifiedAt": "2026-04-29T18:00:00.000Z"
      },
      {
        "id": "cc0e8400-e29b-41d4-a716-446655440002",
        "pbiId": "880e8400-e29b-41d4-a716-446655440000",
        "dorItemId": "dd0e8400-e29b-41d4-a716-446655440002",
        "isVerified": true,
        "notes": "Dependencies identified and resolved",
        "verifiedBy": "550e8400-e29b-41d4-a716-446655440001",
        "verifiedAt": "2026-04-29T18:00:00.000Z"
      }
    ]
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
        "field": "verifications",
        "message": "verifications must be a non-empty array"
      }
    ]
  }
}
```

**403 Forbidden - Insufficient Permissions**

```json
{
  "success": false,
  "error": {
    "code": "AUTHORIZATION_ERROR",
    "message": "Scrum Master role required"
  }
}
```

**404 Not Found**

```json
{
  "success": false,
  "error": {
    "code": "NOT_FOUND",
    "message": "Product backlog item not found"
  }
}
```

**Example Request**

```bash
curl -X POST https://api.scrsphere.dev/api/v1/product-backlog/880e8400-e29b-41d4-a716-446655440000/verify-dor \
  -H "Content-Type: application/json" \
  -b cookies.txt \
  -d '{
    "verifications": [
      {
        "dorItemId": "dd0e8400-e29b-41d4-a716-446655440001",
        "isVerified": true,
        "notes": "Acceptance criteria clearly defined"
      },
      {
        "dorItemId": "dd0e8400-e29b-41d4-a716-446655440002",
        "isVerified": true,
        "notes": "Dependencies identified and resolved"
      }
    ]
  }'
```

---

### Get DoR Verifications

Get all Definition of Ready verifications for a product backlog item.

**Endpoint**

```
GET /api/v1/product-backlog/:id/dor-verifications
```

**Authentication**

- Required

**Rate Limit**

- 100 requests per 15 minutes

**Path Parameters**

- `id` (string, required): Product backlog item UUID

**Success Response**

```http
HTTP/1.1 200 OK
Content-Type: application/json

{
  "success": true,
  "data": {
    "verifications": [
      {
        "id": "cc0e8400-e29b-41d4-a716-446655440001",
        "pbiId": "880e8400-e29b-41d4-a716-446655440000",
        "dorItemId": "dd0e8400-e29b-41d4-a716-446655440001",
        "dorItem": {
          "id": "dd0e8400-e29b-41d4-a716-446655440001",
          "title": "Acceptance criteria defined",
          "description": "Clear and testable acceptance criteria must be documented"
        },
        "isVerified": true,
        "notes": "Acceptance criteria clearly defined",
        "verifiedBy": "550e8400-e29b-41d4-a716-446655440001",
        "verifiedAt": "2026-04-29T18:00:00.000Z"
      },
      {
        "id": "cc0e8400-e29b-41d4-a716-446655440002",
        "pbiId": "880e8400-e29b-41d4-a716-446655440000",
        "dorItemId": "dd0e8400-e29b-41d4-a716-446655440002",
        "dorItem": {
          "id": "dd0e8400-e29b-41d4-a716-446655440002",
          "title": "Dependencies identified",
          "description": "All dependencies on other items or teams must be identified"
        },
        "isVerified": true,
        "notes": "Dependencies identified and resolved",
        "verifiedBy": "550e8400-e29b-41d4-a716-446655440001",
        "verifiedAt": "2026-04-29T18:00:00.000Z"
      }
    ]
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
    "message": "Product backlog item not found"
  }
}
```

**Example Request**

```bash
curl -X GET https://api.scrsphere.dev/api/v1/product-backlog/880e8400-e29b-41d4-a716-446655440000/dor-verifications \
  -b cookies.txt
```

---

## Error Codes

| Code                   | HTTP Status | Description                                               |
| ---------------------- | ----------- | --------------------------------------------------------- |
| `VALIDATION_ERROR`     | 400         | Request validation failed                                 |
| `AUTHENTICATION_ERROR` | 401         | Authentication required                                   |
| `AUTHORIZATION_ERROR`  | 403         | Insufficient permissions                                  |
| `NOT_FOUND`            | 404         | Product backlog item not found                            |
| `CONFLICT`             | 409         | Resource conflict (e.g., duplicate item, invalid reorder) |

## Best Practices

### Backlog Management

1. **Regular Refinement**: Schedule regular backlog refinement sessions to keep items up to date
2. **Clear Acceptance Criteria**: Define testable acceptance criteria for every PBI
3. **Story Points**: Estimate story points during refinement, not during sprint planning
4. **MoSCoW Prioritization**: Use MoSCoW to communicate priority clearly to stakeholders
5. **Reorder Regularly**: Keep the top of the backlog refined and prioritized

### Definition of Done/Ready

1. **DoR Before Sprint**: Verify Definition of Ready before pulling items into a sprint
2. **DoD Before Closing**: Verify Definition of Done before marking items as complete
3. **Document Notes**: Add notes to verifications for audit and context
4. **Team Agreement**: DoD and DoR should be agreed upon by the entire team

### Security

1. **Access Control**: Only Product Owners can create or update PBIs
2. **Audit Trail**: All backlog changes are logged with user and timestamp
3. **Team Isolation**: Backlog items are scoped to teams and cannot be accessed cross-team

---

**Last Updated**: 2026-05-10

**Related Documentation**

- [Authentication API](./authentication.md)
- [Product Goals API](./product-goals.md)
- [Teams API](./teams.md)
- [Definition of Done API](./definition-of-done.md)
- [Definition of Ready API](./definition-of-ready.md)
