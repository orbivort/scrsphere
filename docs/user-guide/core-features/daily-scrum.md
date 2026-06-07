# Daily Scrum

The Daily Scrum is a 15-minute time-boxed event for the Development Team to synchronize activities and create a plan for the next 24 hours.

## Table of Contents

- [Overview](#overview)
- [Conducting the Daily Scrum](#conducting-the-daily-scrum)
- [Providing Updates](#providing-updates)
- [Viewing Team Updates](#viewing-team-updates)
- [Identifying Impediments](#identifying-impediments)
- [Best Practices](#best-practices)
- [Common Anti-Patterns](#common-anti-patterns)

---

## Overview

### Purpose of Daily Scrum

The Daily Scrum is used to:

1. **Inspect** progress toward the Sprint Goal
2. **Synchronize** team activities
3. **Plan** the next 24 hours of work
4. **Identify** impediments

### What It Is NOT

The Daily Scrum is **not**:

- A status report meeting
- A problem-solving session
- A management reporting tool
- A lengthy discussion

### Key Characteristics

| Aspect           | Guideline                                   |
| ---------------- | ------------------------------------------- |
| **Duration**     | Maximum 15 minutes                          |
| **Frequency**    | Every working day                           |
| **Participants** | Development Team (Scrum Master facilitates) |
| **Location**     | Same place and time each day                |
| **Format**       | Each member answers three questions         |

---

## Conducting the Daily Scrum

### Accessing Daily Scrum

1. Click "Daily Scrum" in the sidebar
2. The Daily Scrum interface displays:
   - Today's date
   - Team members
   - Update form
   - Previous updates

### The Three Questions

Each team member answers:

1. **What did I do yesterday** that helped meet the Sprint Goal?
2. **What will I do today** to help meet the Sprint Goal?
3. **Do I see any impediment** that prevents me or the team from meeting the Sprint Goal?

### Daily Process

1. **Team gathers** (same time each day)
2. **Each member provides update**:
   - Briefly answer the three questions
   - Focus on Sprint Goal contribution
   - Raise impediments clearly

3. **Scrum Master notes impediments**
4. **Meeting ends** within 15 minutes
5. **Follow-up discussions** happen after (separate meetings)

---

## Providing Updates

### Entering Your Update

1. **Navigate to Daily Scrum page**
2. **Find your update form** for today
3. **Fill in the three sections**:

   **Yesterday's Work:**

   ```
   Completed user authentication API endpoints
   Fixed login page styling issue
   Reviewed Carol's PR for password reset
   ```

   **Today's Plan:**

   ```
   Implement password reset email functionality
   Write unit tests for auth service
   Start on user profile page
   ```

   **Impediments:**

   ```
   Waiting for design assets from UX team
   Staging environment is down (reported to DevOps)
   ```

4. **Save your update**

### Update Guidelines

**Be Specific:**

```
❌ "Worked on stuff"
✅ "Completed API endpoint for user registration"
```

**Focus on Sprint Goal:**

```
❌ "Had a meeting about next quarter"
✅ "Implemented checkout flow (supports sprint goal)"
```

**Be Brief:**

- One to three items per section
- Save details for after the standup
- Focus on what's most relevant

---

## Viewing Team Updates

### Team Update View

The Daily Scrum page shows all team updates:

```
┌─────────────────────────────────────────────────────────┐
│ Daily Scrum - January 15, 2026                          │
├─────────────────────────────────────────────────────────┤
│                                                         │
│ 👤 Alice                                                │
│   ✓ Yesterday: Auth API, login styling                  │
│   → Today: Password reset email, unit tests             │
│   ⚠ Impediment: Waiting for UX assets                   │
│                                                         │
│ 👤 Bob                                                  │
│   ✓ Yesterday: Database optimization                    │
│   → Today: Performance testing, code review             │
│   ⚠ Impediment: None                                    │
│                                                         │
│ 👤 Carol                                                │
│   ✓ Yesterday: PR review, bug fixes                     │
│   → Today: User profile page                            │
│   ⚠ Impediment: Staging environment down                │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

### Update History

View previous days:

- Click date selector
- See historical updates
- Track patterns over time

### Sprint Progress

The page also shows:

- Sprint Goal reminder
- Days remaining in sprint
- Burndown chart snippet
- Active impediments count

---

## Identifying Impediments

### What is an Impediment?

An impediment is anything that:

- Blocks progress on work items
- Reduces team effectiveness
- Prevents meeting the Sprint Goal

### Common Impediments

| Category      | Examples                                 |
| ------------- | ---------------------------------------- |
| **Technical** | Environment issues, bugs, technical debt |
| **Process**   | Unclear requirements, approval delays    |
| **Resource**  | Missing tools, access, dependencies      |
| **External**  | Vendor delays, stakeholder availability  |
| **Team**      | Illness, conflicts, knowledge gaps       |

### Raising Impediments

1. **During Daily Scrum**:
   - Clearly state the impediment
   - Indicate impact on work
   - Suggest resolution if known

2. **After Daily Scrum**:
   - Scrum Master logs impediment formally
   - Navigate to Impediments page
   - Create impediment record

3. **Track Resolution**:
   - Assign owner
   - Set target resolution date
   - Update status as progress is made

### Impediment Resolution

The Scrum Master is responsible for:

- Removing impediments
- Escalating when necessary
- Keeping the team informed of progress

---

## Best Practices

### For Team Members

**Before the Daily Scrum:**

- Review your work from yesterday
- Know what you'll work on today
- Identify any blockers

**During the Daily Scrum:**

- Be on time
- Listen to others' updates
- Keep your update brief
- Raise impediments clearly

**After the Daily Scrum:**

- Follow up on discussions
- Help resolve impediments
- Update the Sprint Board

### For Scrum Masters

**Facilitation:**

- Start exactly on time
- Keep updates to 15 minutes
- Ensure everyone speaks
- Note impediments for follow-up

**Don't:**

- Let discussions drag on
- Ask for detailed status reports
- Let one person dominate
- Skip the meeting

### For Remote Teams

**Virtual Standup Tips:**

- Use video when possible
- Mute when not speaking
- Have a speaking order
- Use a timer to stay on track
- Consider async updates for time zones

---

## Common Anti-Patterns

### Problems to Avoid

| Anti-Pattern                   | Why It's a Problem    | Solution                        |
| ------------------------------ | --------------------- | ------------------------------- |
| **Status report to manager**   | Not for management    | Team-focused synchronization    |
| **Problem solving in standup** | Takes too long        | "Take it offline"               |
| **Skipping standup**           | Loses synchronization | Make it a habit                 |
| **Long updates**               | Exceeds time box      | Be brief, one sentence per item |
| **No impediments raised**      | Issues fester         | Encourage openness              |
| **Same time every day?**       | Inconsistent          | Fixed time and place            |

### Signs of a Healthy Daily Scrum

- ✅ Starts and ends on time
- ✅ Everyone participates
- ✅ Focus on Sprint Goal
- ✅ Impediments are raised
- ✅ Team self-organizes after

### Signs of an Unhealthy Daily Scrum

- ❌ Regularly runs over 15 minutes
- ❌ Only some people speak
- ❌ Detailed status reports
- ❌ No impediments ever raised
- ❌ Management dominates

---

## Asynchronous Daily Scrum

For distributed teams across time zones, Scrumooth supports async updates.

### How It Works

1. **Team members post updates** when their day starts
2. **Others read updates** before starting work
3. **Sync meeting** held for overlap period (optional)

### Async Update Format

```
📍 Timezone: PST
📅 Date: January 15, 2026

✅ Yesterday:
- Completed user auth API
- Fixed login styling

→ Today:
- Password reset email
- Unit tests

⚠ Impediments:
- Waiting for UX assets (ETA: today 2pm)
```

> **Note**: Asynchronous updates are submitted through the same Daily Scrum interface. Team members can submit their updates at any time during their working day. The Scrum Master can review all updates and identify impediments that need follow-up.

### Reminder Feature

Scrum Masters can send reminders to team members who haven't submitted their daily update:

1. Navigate to the Daily Scrum page
2. View the list of team members who haven't submitted
3. Click "Send Reminder" to notify them
4. Reminders are sent via in-app notifications

> **Note**: Reminders are manual and sent by the Scrum Master. Automatic scheduled reminders are not currently implemented.

---

**Related Topics**:

- [Sprint Board](./sprint-board.md) - Track work progress
- [Sprint Planning](./sprint-planning.md) - Set sprint goal
- [Retrospectives](./retrospectives.md) - Improve the process
