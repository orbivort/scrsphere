# Reports API

Complete Reports API reference for reporting and analytics endpoints. These endpoints are distributed across existing API route groups rather than forming a separate route group.

## Table of Contents

- [Overview](#overview)
- [Authentication](#authentication)
- [Available Reports](#available-reports)
- [Endpoints](#endpoints)
  - [Get Burndown Chart Data](#get-burndown-chart-data)
  - [Get DoD Compliance Report](#get-dod-compliance-report)
  - [Get Increment Delivery Metrics](#get-increment-delivery-metrics)
  - [Get Impediment Statistics](#get-impediment-statistics)
  - [Get Sprint Velocity Data](#get-sprint-velocity-data)
  - [Get Pending Action Items](#get-pending-action-items)
- [Burndown Charts](#burndown-charts)
- [Velocity Tracking](#velocity-tracking)
- [DoD Compliance](#dod-compliance)
- [Increment Metrics](#increment-metrics)
- [Impediment Analytics](#impediment-analytics)
- [Action Item Tracking](#action-item-tracking)
- [Error Codes](#error-codes)
- [Best Practices](#best-practices)

## Overview

The Reports API documents the reporting and analytics endpoints available through existing API routes. These endpoints are not a separate route group but are gathered from various endpoints across the API, providing insights into sprint progress, team velocity, Definition of Done compliance, increment delivery, impediment resolution, and retrospective action items.

## Authentication

All report endpoints require authentication. Include the access token in your request:

**Using Cookies (Recommended)**

```http
GET /api/v1/sprints/550e8400.../burndown
Cookie: accessToken=eyJhbGc...
```

**Using Bearer Token**

```http
GET /api/v1/sprints/550e8400.../burndown
Authorization: Bearer eyJhbGc...
```

## Available Reports

| Report                | Endpoint                                                       | Route Group    | Description                                     |
| --------------------- | -------------------------------------------------------------- | -------------- | ----------------------------------------------- |
| Burndown Chart        | `GET /api/v1/sprints/:sprintId/burndown`                       | Sprints        | Sprint progress with ideal vs actual task lines |
| DoD Compliance        | `GET /api/v1/sprints/:sprintId/dod-compliance`                 | Sprints        | Definition of Done compliance percentage        |
| Increment Metrics     | `GET /api/v1/increments/metrics?teamId=uuid`                   | Increments     | Delivery rate and story point metrics           |
| Impediment Statistics | `GET /api/v1/impediments/stats?teamId=uuid`                    | Impediments    | Impediment counts and resolution time           |
| Sprint Velocity       | `GET /api/v1/sprints?teamId=uuid`                              | Sprints        | Sprint history with story points for velocity   |
| Action Item Tracking  | `GET /api/v1/retrospectives/team/:teamId/pending-action-items` | Retrospectives | Pending vs completed retrospective action items |

## Endpoints

### Get Burndown Chart Data

Get burndown chart data for a specific sprint, including ideal and actual progress lines.

**Endpoint**

```
GET /api/v1/sprints/:sprintId/burndown
```

**Authentication**

- Required
- User must be a team member

**Path Parameters**

- `sprintId` (string, required): Sprint UUID

**Success Response**

```http
HTTP/1.1 200 OK
Content-Type: application/json

{
  "success": true,
  "data": {
    "burndown": {
      "sprintId": "550e8400-e29b-41d4-a716-446655440030",
      "startDate": "2026-04-28T00:00:00.000Z",
      "endDate": "2026-05-11T23:59:59.000Z",
      "idealLine": [
        { "date": "2026-04-28", "remaining": 20 },
        { "date": "2026-04-29", "remaining": 18 },
        { "date": "2026-04-30", "remaining": 16 },
        { "date": "2026-05-01", "remaining": 14 },
        { "date": "2026-05-02", "remaining": 12 },
        { "date": "2026-05-05", "remaining": 10 },
        { "date": "2026-05-06", "remaining": 8 },
        { "date": "2026-05-07", "remaining": 6 },
        { "date": "2026-05-08", "remaining": 4 },
        { "date": "2026-05-09", "remaining": 2 },
        { "date": "2026-05-11", "remaining": 0 }
      ],
      "actualLine": [
        { "date": "2026-04-28", "remaining": 20 },
        { "date": "2026-04-29", "remaining": 19 },
        { "date": "2026-04-30", "remaining": 17 },
        { "date": "2026-05-01", "remaining": 15 },
        { "date": "2026-05-02", "remaining": 14 },
        { "date": "2026-05-05", "remaining": 11 },
        { "date": "2026-05-06", "remaining": 8 },
        { "date": "2026-05-07", "remaining": 5 },
        { "date": "2026-05-08", "remaining": 3 },
        { "date": "2026-05-09", "remaining": 1 }
      ],
      "tasksTotal": 20,
      "tasksCompleted": 19
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
    "message": "Sprint not found"
  }
}
```

**Example Request**

```bash
curl -X GET https://api.scrsphere.dev/api/v1/sprints/550e8400-e29b-41d4-a716-446655440030/burndown \
  -b cookies.txt
```

---

### Get DoD Compliance Report

Get Definition of Done compliance report for a specific sprint.

**Endpoint**

```
GET /api/v1/sprints/:sprintId/dod-compliance
```

**Authentication**

- Required
- User must be a team member

**Path Parameters**

- `sprintId` (string, required): Sprint UUID

**Success Response**

```http
HTTP/1.1 200 OK
Content-Type: application/json

{
  "success": true,
  "data": {
    "compliance": {
      "totalPBIs": 10,
      "compliantPBIs": 8,
      "complianceRate": 80.0,
      "itemResults": [
        {
          "pbiId": "550e8400-e29b-41d4-a716-446655440040",
          "title": "User login page",
          "compliant": true,
          "checklistResults": [
            { "criterion": "Code reviewed", "passed": true },
            { "criterion": "Unit tests written", "passed": true },
            { "criterion": "Documentation updated", "passed": true }
          ]
        },
        {
          "pbiId": "550e8400-e29b-41d4-a716-446655440041",
          "title": "Password reset flow",
          "compliant": false,
          "checklistResults": [
            { "criterion": "Code reviewed", "passed": true },
            { "criterion": "Unit tests written", "passed": false },
            { "criterion": "Documentation updated", "passed": false }
          ]
        }
      ]
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
    "message": "Sprint not found"
  }
}
```

**Example Request**

```bash
curl -X GET https://api.scrsphere.dev/api/v1/sprints/550e8400-e29b-41d4-a716-446655440030/dod-compliance \
  -b cookies.txt
```

---

### Get Increment Delivery Metrics

Get increment delivery metrics for a specific team.

**Endpoint**

```
GET /api/v1/increments/metrics
```

**Authentication**

- Required
- User must be a team member

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
      "averageStoryPoints": 23.5,
      "deliveryRate": 83.3
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
    "message": "teamId query parameter is required"
  }
}
```

**Example Request**

```bash
curl -X GET "https://api.scrsphere.dev/api/v1/increments/metrics?teamId=550e8400-e29b-41d4-a716-446655440000" \
  -b cookies.txt
```

---

### Get Impediment Statistics

Get impediment statistics for a specific team.

**Endpoint**

```
GET /api/v1/impediments/stats
```

**Authentication**

- Required
- User must be a team member

**Query Parameters**

- `teamId` (string, required): Team UUID

**Success Response**

```http
HTTP/1.1 200 OK
Content-Type: application/json

{
  "success": true,
  "data": {
    "stats": {
      "open": 3,
      "inProgress": 2,
      "resolved": 15,
      "closed": 10,
      "averageResolutionTime": "2.5 days"
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
    "message": "teamId query parameter is required"
  }
}
```

**Example Request**

```bash
curl -X GET "https://api.scrsphere.dev/api/v1/impediments/stats?teamId=550e8400-e29b-41d4-a716-446655440000" \
  -b cookies.txt
```

---

### Get Sprint Velocity Data

Get sprint history with story points for velocity calculation.

**Endpoint**

```
GET /api/v1/sprints
```

**Authentication**

- Required
- User must be a team member

**Query Parameters**

- `teamId` (string, required): Team UUID - filters sprints by team for velocity calculation

**Success Response**

```http
HTTP/1.1 200 OK
Content-Type: application/json

{
  "success": true,
  "data": {
    "sprints": [
      {
        "id": "550e8400-e29b-41d4-a716-446655440030",
        "name": "Sprint 5",
        "status": "COMPLETED",
        "startDate": "2026-04-28T00:00:00.000Z",
        "endDate": "2026-05-11T23:59:59.000Z",
        "storyPointsCommitted": 25,
        "storyPointsCompleted": 23
      },
      {
        "id": "550e8400-e29b-41d4-a716-446655440031",
        "name": "Sprint 4",
        "status": "COMPLETED",
        "startDate": "2026-04-14T00:00:00.000Z",
        "endDate": "2026-04-27T23:59:59.000Z",
        "storyPointsCommitted": 20,
        "storyPointsCompleted": 20
      },
      {
        "id": "550e8400-e29b-41d4-a716-446655440032",
        "name": "Sprint 3",
        "status": "COMPLETED",
        "startDate": "2026-03-31T00:00:00.000Z",
        "endDate": "2026-04-13T23:59:59.000Z",
        "storyPointsCommitted": 22,
        "storyPointsCompleted": 18
      }
    ]
  }
}
```

**Example Request**

```bash
curl -X GET "https://api.scrsphere.dev/api/v1/sprints?teamId=550e8400-e29b-41d4-a716-446655440000" \
  -b cookies.txt
```

---

### Get Pending Action Items

Get pending action items from retrospectives for a specific team.

**Endpoint**

```
GET /api/v1/retrospectives/team/:teamId/pending-action-items
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
    "actionItems": [
      {
        "id": "550e8400-e29b-41d4-a716-446655440050",
        "description": "Improve code review process",
        "retrospectiveId": "550e8400-e29b-41d4-a716-446655440051",
        "assigneeId": "550e8400-e29b-41d4-a716-446655440001",
        "status": "PENDING",
        "createdAt": "2026-04-29T12:00:00.000Z"
      },
      {
        "id": "550e8400-e29b-41d4-a716-446655440052",
        "description": "Set up automated testing pipeline",
        "retrospectiveId": "550e8400-e29b-41d4-a716-446655440053",
        "assigneeId": "550e8400-e29b-41d4-a716-446655440004",
        "status": "IN_PROGRESS",
        "createdAt": "2026-04-22T10:00:00.000Z"
      }
    ],
    "summary": {
      "total": 8,
      "pending": 3,
      "inProgress": 2,
      "completed": 3,
      "completionRate": 37.5
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
curl -X GET https://api.scrsphere.dev/api/v1/retrospectives/team/550e8400-e29b-41d4-a716-446655440000/pending-action-items \
  -b cookies.txt
```

---

## Burndown Charts

Burndown charts visualize sprint progress by plotting remaining work over time.

### Data Format

The burndown endpoint returns two data series:

- **idealLine**: A linear descent from total tasks to zero, representing the planned progress
- **actualLine**: The real-time remaining task count per day, reflecting actual team progress

### Ideal vs Actual Lines

| Aspect         | Ideal Line                                | Actual Line                                  |
| -------------- | ----------------------------------------- | -------------------------------------------- |
| Calculation    | Linear: `total - (total / days) * day`    | Count of incomplete tasks at end of each day |
| Purpose        | Baseline for comparison                   | Shows real progress and deviations           |
| Interpretation | On-track when actual is at or below ideal | Behind schedule when actual is above ideal   |

### How to Render

1. Plot dates on the X-axis and remaining tasks on the Y-axis
2. Draw the ideal line as a straight diagonal from top-left to bottom-right
3. Plot the actual line as a step/line chart overlaying the ideal
4. Shade the area between the lines to highlight deviation
5. Use green when actual is at or below ideal, red when above

## Velocity Tracking

Velocity measures the amount of work a team completes per sprint, calculated from sprint history.

### How to Calculate from Sprint History

1. Fetch sprints for a team using `GET /api/v1/sprints?teamId=uuid`
2. For each completed sprint, record `storyPointsCompleted`
3. Calculate the average over the desired number of sprints:

```
Velocity = Sum(storyPointsCompleted for last N sprints) / N
```

### Example Calculation

| Sprint   | Story Points Committed | Story Points Completed |
| -------- | ---------------------- | ---------------------- |
| Sprint 3 | 22                     | 18                     |
| Sprint 4 | 20                     | 20                     |
| Sprint 5 | 25                     | 23                     |

**3-Sprint Velocity** = (18 + 20 + 23) / 3 = **20.3 story points**

### Recommendations

- Use at least 3 sprints for a meaningful average
- Exclude sprints with abnormal events (holidays, team changes) if needed
- Track both committed vs completed points to identify over/under-commitment patterns

## DoD Compliance

Definition of Done compliance measures how many product backlog items meet all DoD criteria within a sprint.

### Compliance Percentage

```
Compliance Rate = (compliantPBIs / totalPBIs) * 100
```

### How It Is Calculated

1. Fetch the DoD compliance report using `GET /api/v1/sprints/:sprintId/dod-compliance`
2. Each PBI is checked against every DoD criterion
3. A PBI is considered compliant only if **all** criteria pass
4. The `complianceRate` field provides the overall percentage
5. The `itemResults` array provides per-PBI breakdown with per-criterion results

### Interpreting Results

| Compliance Rate | Interpretation                             |
| --------------- | ------------------------------------------ |
| 90-100%         | Excellent - team consistently meets DoD    |
| 70-89%          | Good - minor improvements needed           |
| 50-69%          | Needs attention - review DoD criteria      |
| Below 50%       | Critical - team may need DoD re-evaluation |

## Increment Metrics

Increment delivery metrics track the team's ability to deliver working software.

### Delivery Rate

```
Delivery Rate = (deliveredIncrements / totalIncrements) * 100
```

### Story Points Delivered

The `averageStoryPoints` metric represents the mean story points delivered per increment across the measured period. This complements sprint velocity by measuring actual delivered value rather than sprint-level completion.

### Key Metrics

| Metric                | Description                                    |
| --------------------- | ---------------------------------------------- |
| `totalIncrements`     | Total increments planned or created            |
| `deliveredIncrements` | Increments successfully delivered and accepted |
| `averageStoryPoints`  | Average story points per delivered increment   |
| `deliveryRate`        | Percentage of increments delivered (0-100%)    |

## Impediment Analytics

Impediment statistics provide visibility into blockers and their resolution patterns.

### Resolution Time

The `averageResolutionTime` metric indicates how long it typically takes to resolve an impediment from the time it is reported. Lower values indicate a more responsive team.

### Team Impact

| Stat         | Description                                         |
| ------------ | --------------------------------------------------- |
| `open`       | Impediments reported but not yet being addressed    |
| `inProgress` | Impediments currently being worked on               |
| `resolved`   | Impediments resolved but not yet verified as closed |
| `closed`     | Impediments fully resolved and verified             |

### Analysis Tips

- A high `open` count may indicate insufficient attention to blockers
- A high `inProgress` count with low `resolved` may indicate impediments are stuck
- Track `averageResolutionTime` trends over time to measure improvement
- Correlate impediment spikes with sprint velocity drops to identify impact

## Action Item Tracking

Action items from retrospectives track improvement commitments made by the team.

### Pending vs Completed Rate

```
Completion Rate = (completed / total) * 100
```

The `summary` object in the pending action items response provides:

- `total`: All action items across retrospectives
- `pending`: Items not yet started
- `inProgress`: Items currently being worked on
- `completed`: Items fully resolved
- `completionRate`: Percentage of items completed

### Tracking Recommendations

1. **Review Regularly**: Check pending action items at each retrospective
2. **Assign Owners**: Every action item should have a designated assignee
3. **Set Deadlines**: Action items without deadlines tend to remain pending
4. **Limit WIP**: Avoid too many in-progress items simultaneously
5. **Celebrate Completion**: Acknowledge completed action items to reinforce improvement culture

## Error Codes

| Code                   | HTTP Status | Description                                      |
| ---------------------- | ----------- | ------------------------------------------------ |
| `VALIDATION_ERROR`     | 400         | Request validation failed (e.g., missing teamId) |
| `AUTHENTICATION_ERROR` | 401         | Authentication required                          |
| `AUTHORIZATION_ERROR`  | 403         | Insufficient permissions or not a team member    |
| `NOT_FOUND`            | 404         | Sprint, team, or resource not found              |

## Best Practices

### Report Consumption

1. **Caching**: Cache report data on the client side with appropriate stale times (e.g., 5 minutes for burndown, 15 minutes for metrics)
2. **Selective Fetching**: Only fetch reports that are currently displayed to the user
3. **Date Ranges**: Use team-specific queries to limit data scope and improve performance
4. **Error Handling**: Gracefully handle report endpoints that may return empty data for new teams

### Data Interpretation

1. **Context Matters**: Always interpret metrics in the context of team size, sprint length, and project complexity
2. **Trend Analysis**: Focus on trends over time rather than single data points
3. **Combined Metrics**: Use multiple reports together for a complete picture (e.g., velocity + impediment stats)
4. **Avoid Vanity Metrics**: Prioritize actionable insights over impressive numbers

### Security

1. **Access Control**: All report endpoints require team membership verification
2. **Data Isolation**: Reports are scoped to the user's team(s) only
3. **Audit Trail**: Report access is logged for compliance purposes

---

**Last Updated**: 2026-05-10

**Related Documentation**

- [Authentication API](./authentication.md)
- [Sprints API](./sprints.md)
- [Impediments API](./impediments.md)
- [Retrospectives API](./retrospectives.md)
- [Definition of Done API](./definition-of-done.md)
