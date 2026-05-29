# Retrospectives

The Sprint Retrospective is an opportunity for the Scrum Team to inspect itself and create a plan for improvements to be enacted in the next Sprint.

## Table of Contents

- [Overview](#overview)
- [Before the Retrospective](#before-the-retrospective)
- [Conducting the Retrospective](#conducting-the-retrospective)
- [Retrospective Formats](#retrospective-formats)
- [Collecting Feedback](#collecting-feedback)
- [Creating Action Items](#creating-action-items)
- [Tracking Improvements](#tracking-improvements)
- [Best Practices](#best-practices)

---

## Overview

### Purpose of Retrospective

The Retrospective is used to:

1. **Inspect** how the last Sprint went
2. **Identify** what went well and what to improve
3. **Create** a plan for implementing improvements
4. **Commit** to specific actions for next Sprint

### What It Is NOT

The Retrospective is **not**:

- A blame session
- A complaint meeting
- Only about problems
- Optional

### Key Characteristics

| Aspect           | Guideline                             |
| ---------------- | ------------------------------------- |
| **Duration**     | Maximum 1.5 hours for 2-week sprint   |
| **Participants** | Scrum Team only (no stakeholders)     |
| **Focus**        | Process, people, tools, relationships |
| **Outcome**      | Actionable improvement items          |
| **Safety**       | Safe space for honest discussion      |

---

## Before the Retrospective

### Preparation Checklist

**Scrum Master:**

- [ ] Schedule the meeting
- [ ] Prepare retrospective format
- [ ] Gather sprint metrics (velocity, burndown)
- [ ] Review previous action items
- [ ] Prepare the environment (safe space)

**Team Members:**

- [ ] Reflect on the sprint
- [ ] Think about what went well
- [ ] Identify areas for improvement
- [ ] Consider previous action items

### Data to Prepare

Bring to the retrospective:

- Sprint Goal achievement
- Velocity vs. planned
- Burndown chart
- Impediments encountered
- Previous action item status

---

## Conducting the Retrospective

### Accessing Retrospectives

1. Navigate to "Retrospectives" in the sidebar
2. View the list of sprints with their retrospective status
3. Click on a completed sprint to view or create its retrospective
4. If no retrospective exists, click "Create Retrospective"

### Standard Agenda

The retrospective typically follows this agenda (facilitated by the Scrum Master):

```
┌─────────────────────────────────────────────────────────┐
│ RETROSPECTIVE AGENDA                                    │
├─────────────────────────────────────────────────────────┤
│ 1. Set the Stage (5 min)                                │
│    - Prime Directive (recommended)                      │
│    - Establish safety                                   │
│    - Explain format                                     │
│                                                         │
│ 2. Gather Data (15-20 min)                              │
│    - What happened?                                     │
│    - Collect facts and feelings                         │
│                                                         │
│ 3. Generate Insights (20-30 min)                        │
│    - Why did things happen?                             │
│    - Look for patterns                                  │
│    - Identify root causes                               │
│                                                         │
│ 4. Decide What to Do (15-20 min)                        │
│    - What can we improve?                               │
│    - Prioritize actions (use dot voting)                │
│    - Commit to changes                                  │
│                                                         │
│ 5. Close (5 min)                                        │
│    - Summarize actions                                  │
│    - Appreciations                                      │
│    - Feedback on retro                                  │
└─────────────────────────────────────────────────────────┘
```

### The Prime Directive

Begin by reading the Prime Directive (recommended practice):

> "Regardless of what we discover, we understand and truly believe that everyone did the best job they could, given what they knew at the time, their skills and abilities, the resources available, and the situation at hand."

This establishes psychological safety and focuses on learning, not blame.

> **Note**: The Prime Directive is a recommended practice for the facilitator to share verbally. It is not enforced in the Scrsphere UI.

---

## Retrospective Formats

Scrsphere currently implements the **What Went Well / What to Improve** format with three categories:

### What Went Well / What to Improve

The standard format with three columns:

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  😊 WHAT WENT WELL     │  😟 WHAT DIDN'T GO WELL   │  💡 WHAT TO IMPROVE    │
├─────────────────────────────────────────────────────────────────────────────┤
│  • Completed all items │  • Daily standups ran long │  • Add code review SLA │
│  • Good collaboration  │  • Code reviews delayed    │  • Include QA earlier  │
│  • Sprint goal met     │  • Testing bottleneck      │  • Improve estimation  │
│  • Fixed critical bug  │  • Unclear requirements    │  • Better planning     │
└─────────────────────────────────────────────────────────────────────────────┘
```

**Category Descriptions:**

| Category                | Icon | Purpose                                   |
| ----------------------- | ---- | ----------------------------------------- |
| **What Went Well**      | 😊   | Celebrate successes and positive outcomes |
| **What Didn't Go Well** | 😟   | Identify challenges and issues faced      |
| **What to Improve**     | 💡   | Suggest actionable improvements           |

> **Note**: Additional formats (Start/Stop/Continue, 4Ls, Mad/Sad/Glad) are documented in Scrum literature but not currently implemented in Scrsphere. The three-column format provides a balanced view of successes, challenges, and improvement opportunities.

---

## Collecting Feedback

### Individual Input

1. **Each team member adds items**
   - Click the "+" button under each category column
   - Enter your feedback in the text area
   - Be specific and constructive
   - Click "Add" to submit

2. **Author Attribution**
   - Items are automatically attributed to the logged-in user
   - If not logged in, items show "Anonymous" as the author
   - Focus on issues, not people

### Group Discussion

1. **Review all items together**
2. **Cluster similar items**
3. **Discuss each cluster:**
   - What happened?
   - Why did it happen?
   - What can we do about it?

### Dot Voting

Scrsphere implements dot voting to help prioritize items:

**How to Vote:**

1. Each item has a vote button with a 👍 icon and vote count
2. Click the vote button to add your vote
3. Click again to remove your vote
4. Items are automatically sorted by vote count (highest first)

**Voting Features:**

- Visual feedback when you've voted (highlighted button)
- Real-time vote count updates
- Items sorted by popularity
- Disabled during completed retrospectives

**Best Practices for Voting:**

- Vote for items you believe are most important to address
- Consider impact and feasibility when voting
- Use votes to focus discussion on top-priority items
- Typically limit discussion to top 3-5 voted items

---

## Creating Action Items

### What Makes a Good Action Item?

Action items should be:

- **Specific**: Clear what needs to be done
- **Measurable**: Can tell when it's done
- **Assigned**: Someone is responsible
- **Time-bound**: Has a deadline
- **Achievable**: Within team's control

### Action Item Template

```
Action: [What will be done]
Owner: [Who is responsible]
Due: [When it will be done]
Success Measure: [How we know it worked]
```

### Examples

**Good Action Items:**

```
✅ Action: Limit daily standup to 15 minutes with timer
   Owner: Scrum Master
   Due: Next sprint
   Success: Standup consistently ends on time

✅ Action: Add code review checklist to PR template
   Owner: Alice
   Due: This week
   Success: All PRs follow checklist
```

**Poor Action Items:**

```
❌ "Improve communication" (too vague)
❌ "Be better at estimating" (not specific)
❌ "Management should hire more people" (not in team's control)
```

### Creating Actions in Scrsphere

1. In the retrospective interface, click "Add Action Item"
2. Fill in:
   - **Title**: The action to take
   - **Owner**: Who will do it
   - **Due Date**: When
   - **Description**: Additional context
   - **Related Item**: Link to the retro item that prompted this

3. Save the action item

---

## Tracking Improvements

### Action Item Tracking

Action items appear in:

- The retrospective record
- The "Action Items" section of the backlog
- Dashboard reminders

### Action Item Statuses

Action items have their own workflow:

| Status          | Description               |
| --------------- | ------------------------- |
| **Pending**     | Not yet started           |
| **In Progress** | Currently being worked on |
| **Completed**   | Successfully finished     |
| **Cancelled**   | No longer relevant        |

### Adding to Sprint Backlog

Action items can be flagged for addition to the sprint backlog:

**How to Mark for Backlog:**

1. When creating or editing an action item, enable the "Add to Sprint Backlog" option
2. Select the target sprint for the item
3. The action item will display an "In Backlog" badge

**Tracking:**

- Items marked for backlog show a visual indicator
- A hint appears: "This item will be present in the Product Backlog page for action"
- Track the item's progress through the sprint backlog

> **Note**: Action items marked for sprint backlog are flagged for team awareness during sprint planning. The team should review these during refinement and decide whether to create corresponding backlog items.

### Reviewing Previous Actions

At the start of each retrospective:

1. **Review previous action items**
2. **Check status:**
   - ✅ Completed
   - 🔄 In Progress
   - ❌ Not started
   - 🚫 No longer relevant

3. **Discuss outcomes:**
   - Did it help?
   - Should we continue?
   - Adjust if needed?

### Carrying Forward

- Keep incomplete items visible
- Re-commit or adjust as needed
- Don't let items disappear

---

## Best Practices

### For Scrum Masters

**Facilitation:**

- Create a safe environment
- Encourage everyone to speak
- Keep discussions constructive
- Focus on actionable outcomes
- Time-box each section

**Don't:**

- Let it become a blame session
- Dominate the discussion
- Skip the retrospective
- Ignore action items

### For Team Members

**Participation:**

- Be honest but constructive
- Focus on process, not people
- Offer solutions, not just problems
- Commit to improvements

**Tips:**

- Come prepared with thoughts
- Listen actively
- Support agreed actions
- Follow through on commitments

### Psychological Safety

Create safety by:

- Starting with Prime Directive
- No blame or personal attacks
- What happens in retro stays in retro
- Encourage quiet members to speak
- Thank people for honest feedback

---

## Common Anti-Patterns

| Anti-Pattern               | Impact                    | Solution                       |
| -------------------------- | ------------------------- | ------------------------------ |
| **Blame game**             | People stop participating | Focus on process, not people   |
| **No action items**        | Nothing improves          | Always create specific actions |
| **Same issues every time** | No progress               | Dig deeper into root causes    |
| **Skipping retros**        | Team stagnates            | Make it non-negotiable         |
| **Management present**     | Reduced honesty           | Scrum Team only                |
| **Complaint session**      | Negative energy           | Balance with positives         |

---

## Example Retrospective

### Sprint 5 Retrospective

**Format:** What Went Well / What to Improve

**What Went Well:**

- Met sprint goal (wishlist feature complete)
- Good collaboration on complex items
- Daily standups were focused
- Demo went smoothly

**What to Improve:**

- Code reviews delayed (3-day average)
- Testing bottleneck at end of sprint
- Some stories lacked clear acceptance criteria
- Two items carried over due to underestimation

**Root Cause Analysis:**

- Code review delay → Reviewers busy with own work
- Testing bottleneck → Only one QA, testing at end
- Unclear criteria → Rushed refinement
- Underestimation → New technology learning curve

**Action Items:**

| Action                           | Owner         | Due         |
| -------------------------------- | ------------- | ----------- |
| Set 24-hour code review SLA      | Alice         | Next sprint |
| Add WIP limit for in-review      | Scrum Master  | Next sprint |
| Include QA in refinement         | Product Owner | Next sprint |
| Add acceptance criteria template | Bob           | This week   |
| Track estimation accuracy        | Scrum Master  | Ongoing     |

**Previous Action Items Review:**

- ✅ "Add definition of ready" - Completed, working well
- 🔄 "Improve demo preparation" - In progress, need more practice
- ❌ "Reduce meeting time" - Not started, carry forward

---

**Related Topics**:

- [Sprint Review](./sprint-review.md) - Review the product increment
- [Sprint Planning](./sprint-planning.md) - Apply improvements
- [Daily Scrum](./daily-scrum.md) - Daily synchronization
