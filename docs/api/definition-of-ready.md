# Definition of Ready API

Complete Definition of Ready (DoR) API reference for managing team DoR criteria and verifying readiness of Product Backlog Items before sprint planning.

## Table of Contents

- [Overview](#overview)
- [DoR Concepts](#dor-concepts)
- [Authentication](#authentication)
- [Endpoints](#endpoints)
  - [Get Team DoR](#get-team-dor)
  - [Update Team DoR](#update-team-dor)
  - [Get DoR Version History](#get-dor-version-history)
  - [Verify DoR for PBI](#verify-dor-for-pbi)
  - [Get DoR Verifications for PBI](#get-dor-verifications-for-pbi)
- [Error Codes](#error-codes)
- [Best Practices](#best-practices)

## Overview

The Definition of Ready API provides capabilities for:

- Managing a team's Definition of Ready criteria
- Tracking DoR version history over time
- Verifying DoR compliance on individual Product Backlog Items
- Retrieving DoR verification records for a PBI

All DoR endpoints are mounted under `/api/v1/teams/:teamId/definition-of-ready` for team-level operations and `/api/v1/product-backlog/:id/verify-dor` for PBI-level verification operations.

## DoR Concepts

The **Definition of Ready (DoR)** is a shared agreement within a Scrum team on what conditions must be met before a Product Backlog Item (PBI) can be selected for a sprint. It acts as a quality gate that ensures work brought into a sprint is well-understood, properly refined, and ready for implementation.

### Key Principles

- **Prevents Waste**: Items that are not ready waste sprint capacity when the team discovers missing information mid-sprint
- **Shared Understanding**: The DoR ensures the team and Product Owner have a common understanding of what "ready" means
- **Refinement Guide**: The DoR serves as a checklist during backlog refinement to assess PBI readiness
- **Negotiable Gate**: Unlike the DoD, DoR criteria can be partially met; the team may choose to bring an item into a sprint even if some criteria are not fully satisfied
- **Per-Team**: Each team defines its own DoR, which may differ from other teams based on context and maturity

### Common DoR Criteria Examples

- User story has clear acceptance criteria
- Dependencies have been identified and resolved
- Design mockups or wireframes are available
- Story has been estimated by the team
- Story is small enough to be completed within a sprint
- Product Owner is available to answer questions

### DoR vs. DoD

| Aspect         | Definition of Ready                             | Definition of Done                    |
| -------------- | ----------------------------------------------- | ------------------------------------- |
| **Timing**     | Checked before sprint planning                  | Checked during/after sprint execution |
| **Purpose**    | Ensures PBI is ready to be worked on            | Ensures PBI meets quality standards   |
| **Strictness** | Advisory; team may accept partially ready items | Mandatory; all criteria must be met   |
| **Owner**      | Entire team (with Product Owner input)          | Entire team                           |
| **Focus**      | Preparedness and clarity                        | Quality and completeness              |

### When to Verify DoR

- **Backlog Refinement**: During refinement sessions, the team assesses DoR readiness
- **Sprint Planning**: Before committing to items, verify they meet DoR criteria
- **Continuous**: Product Owner and team can verify DoR at any time as understanding evolves

## Authentication

All DoR endpoints require authentication. Include the access token in your request:

**Using Cookies (Recommended)**

```http
GET /api/v1/teams/:teamId/definition-of-ready
Cookie: accessToken=eyJhbGc...
```

**Using Bearer Token**

```http
GET /api/v1/teams/:teamId/definition-of-ready
Authorization: Bearer eyJhbGc...
```

## Endpoints

### Get Team DoR

Get the current Definition of Ready for a team.

**Endpoint**

```
GET /api/v1/teams/:teamId/definition-of-ready
```

**Authentication**

- Required
- User must be a team member

**Path Parameters**

- `teamId` (string, required): Team UUID

**Success Response**

```http
HTTP/1.1 200 OK
Content-Type: application/json

{
  "success": true,
  "data": {
    "definitionOfReady": {
      "id": "550e8400-e29b-41d4-a716-446655440110",
      "teamId": "550e8400-e29b-41d4-a716-446655440000",
      "items": [
        {
          "id": "550e8400-e29b-41d4-a716-446655440111",
          "description": "User story has clear acceptance criteria",
          "order": 1,
          "createdAt": "2026-04-29T12:00:00.000Z"
        },
        {
          "id": "550e8400-e29b-41d4-a716-446655440112",
          "description": "Dependencies have been identified and resolved",
          "order": 2,
          "createdAt": "2026-04-29T12:00:00.000Z"
        },
        {
          "id": "550e8400-e29b-41d4-a716-446655440113",
          "description": "Story has been estimated by the team",
          "order": 3,
          "createdAt": "2026-04-29T12:00:00.000Z"
        }
      ],
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
    "message": "Team not found"
  }
}
```

**403 Forbidden - Not a Member**

```json
{
  "success": false,
  "error": {
    "code": "AUTHORIZATION_ERROR",
    "message": "You are not a member of this team"
  }
}
```

**Example Request**

```bash
curl -X GET https://api.scrsphere.dev/api/v1/teams/550e8400-e29b-41d4-a716-446655440000/definition-of-ready \
  -b cookies.txt
```

---

### Update Team DoR

Update the Definition of Ready for a team. Replaces all existing items. Requires Scrum Master role.

**Endpoint**

```
PUT /api/v1/teams/:teamId/definition-of-ready
```

**Authentication**

- Required
- Scrum Master role required

**Path Parameters**

- `teamId` (string, required): Team UUID

**Request Body**

```json
{
  "items": [
    {
      "description": "string (required, 1-500 chars)"
    }
  ]
}
```

**Success Response**

```http
HTTP/1.1 200 OK
Content-Type: application/json

{
  "success": true,
  "data": {
    "definitionOfReady": {
      "id": "550e8400-e29b-41d4-a716-446655440110",
      "teamId": "550e8400-e29b-41d4-a716-446655440000",
      "items": [
        {
          "id": "550e8400-e29b-41d4-a716-446655440121",
          "description": "User story has clear and testable acceptance criteria",
          "order": 1,
          "createdAt": "2026-04-29T13:00:00.000Z"
        },
        {
          "id": "550e8400-e29b-41d4-a716-446655440122",
          "description": "Dependencies have been identified and resolved",
          "order": 2,
          "createdAt": "2026-04-29T13:00:00.000Z"
        },
        {
          "id": "550e8400-e29b-41d4-a716-446655440123",
          "description": "Design mockups or wireframes are available",
          "order": 3,
          "createdAt": "2026-04-29T13:00:00.000Z"
        },
        {
          "id": "550e8400-e29b-41d4-a716-446655440124",
          "description": "Story has been estimated by the team",
          "order": 4,
          "createdAt": "2026-04-29T13:00:00.000Z"
        },
        {
          "id": "550e8400-e29b-41d4-a716-446655440125",
          "description": "Story is small enough to be completed within a sprint",
          "order": 5,
          "createdAt": "2026-04-29T13:00:00.000Z"
        }
      ],
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
        "field": "items[0].description",
        "message": "Description is required"
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

**Example Request**

```bash
curl -X PUT https://api.scrsphere.dev/api/v1/teams/550e8400-e29b-41d4-a716-446655440000/definition-of-ready \
  -H "Content-Type: application/json" \
  -b cookies.txt \
  -d '{
    "items": [
      { "description": "User story has clear and testable acceptance criteria" },
      { "description": "Dependencies have been identified and resolved" },
      { "description": "Design mockups or wireframes are available" },
      { "description": "Story has been estimated by the team" },
      { "description": "Story is small enough to be completed within a sprint" }
    ]
  }'
```

---

### Get DoR Version History

Get the version history of the team's Definition of Ready, showing how it has evolved over time.

**Endpoint**

```
GET /api/v1/teams/:teamId/definition-of-ready/history
```

**Authentication**

- Required
- User must be a team member

**Path Parameters**

- `teamId` (string, required): Team UUID

**Query Parameters**

- `page` (integer, optional): Page number (default: 1)
- `limit` (integer, optional): Items per page (default: 20, max: 100)

**Success Response**

```http
HTTP/1.1 200 OK
Content-Type: application/json

{
  "success": true,
  "data": {
    "history": [
      {
        "id": "550e8400-e29b-41d4-a716-446655440130",
        "version": 2,
        "items": [
          {
            "id": "550e8400-e29b-41d4-a716-446655440121",
            "description": "User story has clear and testable acceptance criteria",
            "order": 1
          },
          {
            "id": "550e8400-e29b-41d4-a716-446655440122",
            "description": "Dependencies have been identified and resolved",
            "order": 2
          },
          {
            "id": "550e8400-e29b-41d4-a716-446655440123",
            "description": "Design mockups or wireframes are available",
            "order": 3
          },
          {
            "id": "550e8400-e29b-41d4-a716-446655440124",
            "description": "Story has been estimated by the team",
            "order": 4
          },
          {
            "id": "550e8400-e29b-41d4-a716-446655440125",
            "description": "Story is small enough to be completed within a sprint",
            "order": 5
          }
        ],
        "updatedBy": {
          "id": "550e8400-e29b-41d4-a716-446655440001",
          "firstName": "John",
          "lastName": "Doe"
        },
        "createdAt": "2026-04-29T13:00:00.000Z"
      },
      {
        "id": "550e8400-e29b-41d4-a716-446655440131",
        "version": 1,
        "items": [
          {
            "id": "550e8400-e29b-41d4-a716-446655440111",
            "description": "User story has clear acceptance criteria",
            "order": 1
          },
          {
            "id": "550e8400-e29b-41d4-a716-446655440112",
            "description": "Dependencies have been identified and resolved",
            "order": 2
          },
          {
            "id": "550e8400-e29b-41d4-a716-446655440113",
            "description": "Story has been estimated by the team",
            "order": 3
          }
        ],
        "updatedBy": {
          "id": "550e8400-e29b-41d4-a716-446655440001",
          "firstName": "John",
          "lastName": "Doe"
        },
        "createdAt": "2026-04-29T12:00:00.000Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 2,
      "totalPages": 1,
      "hasNext": false,
      "hasPrev": false
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
    "message": "Team not found"
  }
}
```

**Example Request**

```bash
curl -X GET https://api.scrsphere.dev/api/v1/teams/550e8400-e29b-41d4-a716-446655440000/definition-of-ready/history \
  -b cookies.txt
```

---

### Verify DoR for PBI

Verify Definition of Ready compliance for a specific Product Backlog Item. Each DoR item can be marked as verified or not verified with optional notes.

**Endpoint**

```
POST /api/v1/product-backlog/:id/verify-dor
```

**Authentication**

- Required
- User must be a team member

**Path Parameters**

- `id` (string, required): Product Backlog Item UUID

**Request Body**

```json
{
  "verifications": [
    {
      "dorItemId": "string (required, UUID of the DoR item)",
      "isVerified": "boolean (required)",
      "notes": "string (optional, max 1000 chars)"
    }
  ]
}
```

**Success Response**

```http
HTTP/1.1 200 OK
Content-Type: application/json

{
  "success": true,
  "data": {
    "verification": {
      "id": "550e8400-e29b-41d4-a716-446655440140",
      "pbiId": "550e8400-e29b-41d4-a716-446655440150",
      "verifiedBy": "550e8400-e29b-41d4-a716-446655440001",
      "verifications": [
        {
          "dorItemId": "550e8400-e29b-41d4-a716-446655440121",
          "isVerified": true,
          "notes": "Acceptance criteria defined in Jira ticket"
        },
        {
          "dorItemId": "550e8400-e29b-41d4-a716-446655440122",
          "isVerified": true,
          "notes": "No external dependencies"
        },
        {
          "dorItemId": "550e8400-e29b-41d4-a716-446655440123",
          "isVerified": false,
          "notes": "Wireframes still in progress"
        },
        {
          "dorItemId": "550e8400-e29b-41d4-a716-446655440124",
          "isVerified": true,
          "notes": "Estimated at 5 story points"
        },
        {
          "dorItemId": "550e8400-e29b-41d4-a716-446655440125",
          "isVerified": true,
          "notes": null
        }
      ],
      "allVerified": false,
      "createdAt": "2026-04-29T14:00:00.000Z"
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
        "field": "verifications[0].dorItemId",
        "message": "Valid UUID is required"
      }
    ]
  }
}
```

**404 Not Found - PBI Not Found**

```json
{
  "success": false,
  "error": {
    "code": "NOT_FOUND",
    "message": "Product Backlog Item not found"
  }
}
```

**Example Request**

```bash
curl -X POST https://api.scrsphere.dev/api/v1/product-backlog/550e8400-e29b-41d4-a716-446655440150/verify-dor \
  -H "Content-Type: application/json" \
  -b cookies.txt \
  -d '{
    "verifications": [
      { "dorItemId": "550e8400-e29b-41d4-a716-446655440121", "isVerified": true, "notes": "Acceptance criteria defined" },
      { "dorItemId": "550e8400-e29b-41d4-a716-446655440122", "isVerified": true, "notes": "No external dependencies" },
      { "dorItemId": "550e8400-e29b-41d4-a716-446655440123", "isVerified": false, "notes": "Wireframes still in progress" },
      { "dorItemId": "550e8400-e29b-41d4-a716-446655440124", "isVerified": true, "notes": "Estimated at 5 story points" },
      { "dorItemId": "550e8400-e29b-41d4-a716-446655440125", "isVerified": true }
    ]
  }'
```

---

### Get DoR Verifications for PBI

Get all DoR verification records for a specific Product Backlog Item.

**Endpoint**

```
GET /api/v1/product-backlog/:id/dor-verifications
```

**Authentication**

- Required
- User must be a team member

**Path Parameters**

- `id` (string, required): Product Backlog Item UUID

**Success Response**

```http
HTTP/1.1 200 OK
Content-Type: application/json

{
  "success": true,
  "data": {
    "verifications": [
      {
        "id": "550e8400-e29b-41d4-a716-446655440140",
        "pbiId": "550e8400-e29b-41d4-a716-446655440150",
        "verifiedBy": {
          "id": "550e8400-e29b-41d4-a716-446655440001",
          "firstName": "John",
          "lastName": "Doe"
        },
        "verifications": [
          {
            "dorItemId": "550e8400-e29b-41d4-a716-446655440121",
            "dorItemDescription": "User story has clear and testable acceptance criteria",
            "isVerified": true,
            "notes": "Acceptance criteria defined in Jira ticket"
          },
          {
            "dorItemId": "550e8400-e29b-41d4-a716-446655440122",
            "dorItemDescription": "Dependencies have been identified and resolved",
            "isVerified": true,
            "notes": "No external dependencies"
          },
          {
            "dorItemId": "550e8400-e29b-41d4-a716-446655440123",
            "dorItemDescription": "Design mockups or wireframes are available",
            "isVerified": false,
            "notes": "Wireframes still in progress"
          },
          {
            "dorItemId": "550e8400-e29b-41d4-a716-446655440124",
            "dorItemDescription": "Story has been estimated by the team",
            "isVerified": true,
            "notes": "Estimated at 5 story points"
          },
          {
            "dorItemId": "550e8400-e29b-41d4-a716-446655440125",
            "dorItemDescription": "Story is small enough to be completed within a sprint",
            "isVerified": true,
            "notes": null
          }
        ],
        "allVerified": false,
        "createdAt": "2026-04-29T14:00:00.000Z"
      }
    ]
  }
}
```

**Error Responses**

**404 Not Found - PBI Not Found**

```json
{
  "success": false,
  "error": {
    "code": "NOT_FOUND",
    "message": "Product Backlog Item not found"
  }
}
```

**Example Request**

```bash
curl -X GET https://api.scrsphere.dev/api/v1/product-backlog/550e8400-e29b-41d4-a716-446655440150/dor-verifications \
  -b cookies.txt
```

---

## Error Codes

| Code                   | HTTP Status | Description                                   |
| ---------------------- | ----------- | --------------------------------------------- |
| `VALIDATION_ERROR`     | 400         | Request validation failed                     |
| `AUTHENTICATION_ERROR` | 401         | Authentication required                       |
| `AUTHORIZATION_ERROR`  | 403         | Insufficient permissions or not a team member |
| `NOT_FOUND`            | 404         | Team or PBI not found                         |
| `CONFLICT`             | 409         | Resource conflict                             |

## Best Practices

### DoR Management

1. **Team Collaboration**: Define DoR items collaboratively to ensure shared understanding of readiness
2. **Practical Criteria**: Write DoR criteria that are practical and verifiable, not aspirational
3. **Regular Review**: Revisit the DoR during retrospectives to adapt to team maturity and process changes
4. **Version Awareness**: Use version history to track how the DoR has evolved and why
5. **Balance**: Avoid overly strict DoR that blocks sprint planning; aim for criteria that ensure readiness without creating bottlenecks

### DoR Verification

1. **Verify During Refinement**: Assess DoR readiness during backlog refinement, not just at sprint planning
2. **Document Notes**: Use the notes field to capture context for why an item was or was not verified
3. **Advisory Nature**: Remember that DoR is advisory; the team may choose to bring a partially ready item into a sprint if they accept the risk
4. **Product Owner Involvement**: The Product Owner should be actively involved in ensuring DoR criteria are met
5. **Update as Understanding Evolves**: Re-verify DoR as the team's understanding of a PBI deepens

### Sprint Planning

1. **Use as Input**: Leverage DoR verification results during sprint planning to assess which items are safe to commit to
2. **Risk Assessment**: Items that do not meet all DoR criteria carry higher risk; factor this into sprint commitments
3. **Continuous Improvement**: Track patterns of DoR non-compliance to identify systemic refinement gaps

---

**Last Updated**: 2026-05-10

**Related Documentation**

- [Definition of Done API](./definition-of-done.md)
- [Teams API](./teams.md)
- [Product Backlog API](./product-backlog.md)
- [Sprints API](./sprints.md)
