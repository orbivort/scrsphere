# Notifications API

Complete Notifications API reference for managing user notifications, read status, and direct messaging.

## Table of Contents

- [Overview](#overview)
- [Authentication](#authentication)
- [Notification Types](#notification-types)
- [Endpoints](#endpoints)
  - [Get Notifications](#get-notifications)
  - [Get Unread Count](#get-unread-count)
  - [Send Message](#send-message)
  - [Mark as Read](#mark-as-read)
  - [Mark All as Read](#mark-all-as-read)
  - [Delete Notification](#delete-notification)
- [Error Codes](#error-codes)
- [Best Practices](#best-practices)

## Overview

The Notifications API provides comprehensive notification management capabilities including:

- Notification listing with filtering and pagination
- Unread notification count tracking
- Direct messaging between team members
- Read status management (individual and bulk)
- Notification deletion

All notification endpoints are subject to a dedicated rate limit of **200 requests per 15 minutes**.

## Authentication

All notification endpoints require authentication. Include the access token in your request:

**Using Cookies (Recommended)**

```http
GET /api/v1/notifications
Cookie: accessToken=eyJhbGc...
```

**Using Bearer Token**

```http
GET /api/v1/notifications
Authorization: Bearer eyJhbGc...
```

## Notification Types

Notifications are categorized by type. The following types are supported:

| Type                    | Description                                  |
| ----------------------- | -------------------------------------------- |
| `SPRINT_STARTED`        | A sprint has been started                    |
| `SPRINT_COMPLETED`      | A sprint has been completed                  |
| `SPRINT_CANCELLED`      | A sprint has been cancelled                  |
| `TASK_ASSIGNED`         | A task has been assigned to the user         |
| `TASK_UPDATED`          | A task assigned to the user has been updated |
| `IMPEDIMENT_CREATED`    | A new impediment has been reported           |
| `IMPEDIMENT_RESOLVED`   | An impediment has been resolved              |
| `MEMBER_ADDED`          | A new member has been added to the team      |
| `MEMBER_REMOVED`        | A member has been removed from the team      |
| `GOAL_STATUS_CHANGED`   | A product goal status has changed            |
| `BACKLOG_ITEM_UPDATED`  | A backlog item has been updated              |
| `RETROSPECTIVE_CREATED` | A retrospective has been created             |
| `DAILY_UPDATE_REMINDER` | Reminder to submit daily scrum update        |
| `SYSTEM_ANNOUNCEMENT`   | System-wide announcement from administrators |

## Endpoints

### Get Notifications

Get notifications for the authenticated user with optional filtering and pagination.

**Endpoint**

```
GET /api/v1/notifications
```

**Authentication**

- Required

**Query Parameters**

- `page` (integer, optional): Page number (default: 1)
- `limit` (integer, optional): Items per page (default: 20, max: 100)
- `type` (string, optional): Filter by notification type (see [Notification Types](#notification-types))
- `isRead` (boolean, optional): Filter by read status - true/false

**Success Response**

```http
HTTP/1.1 200 OK
Content-Type: application/json

{
  "success": true,
  "data": {
    "notifications": [
      {
        "id": "550e8400-e29b-41d4-a716-446655440010",
        "type": "TASK_ASSIGNED",
        "title": "Task Assigned",
        "message": "You have been assigned to 'Implement login page'",
        "isRead": false,
        "createdAt": "2026-04-29T12:00:00.000Z"
      },
      {
        "id": "550e8400-e29b-41d4-a716-446655440011",
        "type": "SPRINT_STARTED",
        "title": "Sprint Started",
        "message": "Sprint 'Sprint 5' has been started",
        "isRead": true,
        "createdAt": "2026-04-28T09:00:00.000Z"
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

**Example Request**

```bash
curl -X GET "https://api.scrsphere.dev/api/v1/notifications?type=TASK_ASSIGNED&isRead=false" \
  -b cookies.txt
```

---

### Get Unread Count

Get the count of unread notifications for the authenticated user.

**Endpoint**

```
GET /api/v1/notifications/unread-count
```

**Authentication**

- Required

**Success Response**

```http
HTTP/1.1 200 OK
Content-Type: application/json

{
  "success": true,
  "data": {
    "count": 5
  }
}
```

**Example Request**

```bash
curl -X GET https://api.scrsphere.dev/api/v1/notifications/unread-count \
  -b cookies.txt
```

---

### Send Message

Send a direct message to a team member. Creates a notification for the recipient.

**Endpoint**

```
POST /api/v1/notifications/send-message
```

**Authentication**

- Required

**Request Body**

```json
{
  "recipientId": "string (required, user UUID)",
  "message": "string (required, message content)"
}
```

**Success Response**

```http
HTTP/1.1 201 Created
Content-Type: application/json

{
  "success": true,
  "data": {
    "message": {
      "id": "550e8400-e29b-41d4-a716-446655440020",
      "senderId": "550e8400-e29b-41d4-a716-446655440001",
      "recipientId": "550e8400-e29b-41d4-a716-446655440004",
      "content": "Hey, can you review the PR when you get a chance?",
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
        "field": "recipientId",
        "message": "Recipient ID is required"
      }
    ]
  }
}
```

**404 Not Found - Recipient Not Found**

```json
{
  "success": false,
  "error": {
    "code": "NOT_FOUND",
    "message": "Recipient not found"
  }
}
```

**Example Request**

```bash
curl -X POST https://api.scrsphere.dev/api/v1/notifications/send-message \
  -H "Content-Type: application/json" \
  -b cookies.txt \
  -d '{
    "recipientId": "550e8400-e29b-41d4-a716-446655440004",
    "message": "Hey, can you review the PR when you get a chance?"
  }'
```

---

### Mark as Read

Mark a single notification as read.

**Endpoint**

```
PATCH /api/v1/notifications/:id/read
```

**Authentication**

- Required

**Path Parameters**

- `id` (string, required): Notification UUID

**Success Response**

```http
HTTP/1.1 200 OK
Content-Type: application/json

{
  "success": true,
  "data": {
    "notification": {
      "id": "550e8400-e29b-41d4-a716-446655440010",
      "type": "TASK_ASSIGNED",
      "title": "Task Assigned",
      "message": "You have been assigned to 'Implement login page'",
      "isRead": true,
      "createdAt": "2026-04-29T12:00:00.000Z"
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
    "message": "Notification not found"
  }
}
```

**Example Request**

```bash
curl -X PATCH https://api.scrsphere.dev/api/v1/notifications/550e8400-e29b-41d4-a716-446655440010/read \
  -b cookies.txt
```

---

### Mark All as Read

Mark all notifications as read, or only specific notifications if IDs are provided.

**Endpoint**

```
PATCH /api/v1/notifications/mark-all-read
```

**Authentication**

- Required

**Request Body**

```json
{
  "notificationIds": "array of UUIDs (optional - if provided, only marks those as read)"
}
```

**Success Response**

```http
HTTP/1.1 200 OK
Content-Type: application/json

{
  "success": true,
  "data": {
    "updatedCount": 5
  }
}
```

**Example Request**

Mark all notifications as read:

```bash
curl -X PATCH https://api.scrsphere.dev/api/v1/notifications/mark-all-read \
  -H "Content-Type: application/json" \
  -b cookies.txt
```

Mark specific notifications as read:

```bash
curl -X PATCH https://api.scrsphere.dev/api/v1/notifications/mark-all-read \
  -H "Content-Type: application/json" \
  -b cookies.txt \
  -d '{
    "notificationIds": [
      "550e8400-e29b-41d4-a716-446655440010",
      "550e8400-e29b-41d4-a716-446655440011",
      "550e8400-e29b-41d4-a716-446655440012"
    ]
  }'
```

---

### Delete Notification

Delete a notification. This action is irreversible.

**Endpoint**

```
DELETE /api/v1/notifications/:id
```

**Authentication**

- Required

**Path Parameters**

- `id` (string, required): Notification UUID

**Success Response**

```http
HTTP/1.1 200 OK
Content-Type: application/json

{
  "success": true,
  "data": {
    "message": "Notification deleted"
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
    "message": "Notification not found"
  }
}
```

**Example Request**

```bash
curl -X DELETE https://api.scrsphere.dev/api/v1/notifications/550e8400-e29b-41d4-a716-446655440010 \
  -b cookies.txt
```

---

## Error Codes

| Code                   | HTTP Status | Description                                  |
| ---------------------- | ----------- | -------------------------------------------- |
| `VALIDATION_ERROR`     | 400         | Request validation failed                    |
| `AUTHENTICATION_ERROR` | 401         | Authentication required                      |
| `AUTHORIZATION_ERROR`  | 403         | Insufficient permissions                     |
| `NOT_FOUND`            | 404         | Notification or recipient not found          |
| `RATE_LIMIT_EXCEEDED`  | 429         | Notification rate limit exceeded (200/15min) |

## Best Practices

### Notification Management

1. **Polling Frequency**: Poll unread count at reasonable intervals (e.g., every 30 seconds) rather than continuous polling
2. **Bulk Operations**: Use `mark-all-read` with `notificationIds` for batch updates instead of individual PATCH requests
3. **Filtering**: Use the `type` and `isRead` query parameters to reduce payload size and improve performance
4. **Pagination**: Always use pagination when fetching notifications to avoid large responses

### Direct Messaging

1. **Recipient Validation**: Ensure the recipient is a team member before sending a message
2. **Message Content**: Keep messages concise and relevant to the project
3. **Rate Limiting**: Respect the 200 requests per 15 minutes rate limit to avoid throttling

### Security

1. **Access Control**: Users can only access and manage their own notifications
2. **Audit Trail**: All notification actions are logged
3. **Input Validation**: Message content is validated and sanitized on the server

---

**Last Updated**: 2026-05-10

**Related Documentation**

- [Authentication API](./authentication.md)
- [Teams API](./teams.md)
- [Sprints API](./sprints.md)
