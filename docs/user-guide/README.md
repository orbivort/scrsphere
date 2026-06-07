# Scrumooth User Guide

Welcome to the Scrumooth User Guide. This comprehensive documentation will help you understand and effectively use Scrumooth, your Agile Scrum Lifecycle Management System.

---

## About This Guide

### What is Scrumooth?

Scrumooth is a self-hosted web application for managing Agile Scrum processes. It faithfully follows the Scrum Guide and provides tools for the entire Scrum lifecycle:

- **Product Goals** - Define and track strategic objectives
- **Product Backlog** - Manage and prioritize work items
- **Sprint Planning** - Plan iterations with capacity management
- **Sprint Execution** - Track progress with Kanban boards
- **Daily Scrum** - Coordinate daily standups
- **Sprint Reviews** - Gather feedback and demonstrate work
- **Retrospectives** - Reflect and improve processes

### Who Should Use This Guide?

This guide is designed for all Scrumooth users:

| Role               | Primary Sections                               |
| ------------------ | ---------------------------------------------- |
| **Product Owners** | Getting Started, Core Features                 |
| **Scrum Masters**  | Getting Started, Core Features, Retrospectives |
| **Developers**     | Getting Started, Sprint Board, Daily Scrum     |

---

## Documentation Structure

```
user-guide/
├── README.md                    # This file - Overview and navigation
├── getting-started/             # New user onboarding
│   └── README.md                # Step-by-step setup guide
└── core-features/               # Feature-specific guides
    ├── README.md                # Feature overview
    ├── product-goals.md         # Product Goals guide
    ├── product-backlog.md       # Backlog management guide
    ├── sprint-planning.md       # Sprint planning guide
    ├── sprint-board.md          # Sprint board (Kanban) guide
    ├── daily-scrum.md           # Daily Scrum guide
    ├── sprint-review.md         # Sprint review guide
    └── retrospectives.md        # Retrospectives guide
```

---

## Quick Navigation

### I'm New to Scrumooth

**Start here**: [Getting Started Guide](./getting-started/README.md)

1. [Create your account](./getting-started/README.md#step-1-account-registration)
2. [Set up your team](./getting-started/README.md#step-2-team-setup)
3. [Create your first product goal](./getting-started/README.md#step-3-create-your-first-product-goal)
4. [Add backlog items](./getting-started/README.md#step-4-add-backlog-items)
5. [Plan your first sprint](./getting-started/README.md#step-5-plan-your-first-sprint)

### I Need Help with a Specific Feature

| Feature         | Guide                                                       |
| --------------- | ----------------------------------------------------------- |
| Product Goals   | [Product Goals Guide](./core-features/product-goals.md)     |
| Product Backlog | [Product Backlog Guide](./core-features/product-backlog.md) |
| Sprint Planning | [Sprint Planning Guide](./core-features/sprint-planning.md) |
| Sprint Board    | [Sprint Board Guide](./core-features/sprint-board.md)       |
| Daily Scrum     | [Daily Scrum Guide](./core-features/daily-scrum.md)         |
| Sprint Review   | [Sprint Review Guide](./core-features/sprint-review.md)     |
| Retrospectives  | [Retrospectives Guide](./core-features/retrospectives.md)   |

---

## Scrum Framework Overview

Scrumooth implements the Scrum framework as defined in the [Scrum Guide](https://scrumguides.org/).

### Scrum Events

```
┌─────────────────────────────────────────────────────────────────┐
│                      SPRINT LIFECYCLE                            │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│   ┌─────────────────┐                                            │
│   │ Sprint Planning │ ──▶ Define Sprint Goal & select work       │
│   └─────────────────┘                                            │
│            │                                                     │
│            ▼                                                     │
│   ┌─────────────────┐     ┌──────────────┐                      │
│   │ Sprint Board    │ ◀── │ Daily Scrum  │ ──▶ Daily sync       │
│   │ (Execute Work)  │     │ (15 min)     │                      │
│   └─────────────────┘     └──────────────┘                      │
│            │                                                     │
│            ▼                                                     │
│   ┌─────────────────┐                                            │
│   │ Sprint Review   │ ──▶ Demo & gather feedback                 │
│   └─────────────────┘                                            │
│            │                                                     │
│            ▼                                                     │
│   ┌─────────────────┐                                            │
│   │ Retrospective   │ ──▶ Reflect & improve                      │
│   └─────────────────┘                                            │
│            │                                                     │
│            └──────▶ Repeat for next sprint                       │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### Scrum Roles

| Role              | Responsibility         | Scrumooth Permissions              |
| ----------------- | ---------------------- | ---------------------------------- |
| **Product Owner** | Maximize product value | Manage backlog, goals, planning    |
| **Scrum Master**  | Facilitate Scrum       | Facilitate ceremonies, impediments |
| **Developer**     | Create increment       | Execute work, update tasks         |

### Scrum Artifacts

| Artifact            | Description                                      |
| ------------------- | ------------------------------------------------ |
| **Product Backlog** | Ordered list of everything needed in the product |
| **Sprint Backlog**  | Items selected for the current sprint            |
| **Increment**       | Sum of all completed items                       |
| **Product Goal**    | Long-term objective for the product              |
| **Sprint Goal**     | Objective for the current sprint                 |

---

## Common Tasks

### Starting a New Sprint

1. Review [Sprint Planning Guide](./core-features/sprint-planning.md)
2. Ensure backlog items are refined and estimated
3. Define a clear Sprint Goal
4. Select items based on team capacity
5. Start the sprint and track on the Sprint Board

### Daily Work Routine

1. Check the [Sprint Board](./core-features/sprint-board.md) for your tasks
2. Participate in [Daily Scrum](./core-features/daily-scrum.md)
3. Update task status as you progress
4. Raise impediments immediately

### Ending a Sprint

1. Complete all Definition of Done criteria
2. Conduct [Sprint Review](./core-features/sprint-review.md) with stakeholders
3. Hold [Retrospective](./core-features/retrospectives.md) with the team
4. Document action items for improvement
5. Plan the next sprint

---

## Tips for Success

### For Product Owners

- Keep the backlog refined and prioritized
- Write clear acceptance criteria
- Engage stakeholders regularly
- Focus on value, not output

### For Scrum Masters

- Protect the team from interruptions
- Remove impediments quickly
- Facilitate, don't dictate
- Foster continuous improvement

### For Developers

- Commit to sprint goals
- Update the board daily
- Collaborate with teammates
- Maintain quality standards

---

## Getting Help

### In-Application

- Look for help icons (💡) throughout the interface
- Hover over fields for tooltips
- Press **?** for keyboard shortcuts

### Documentation

- Browse the guides in this documentation

### Support

- Review existing documentation first
- Check the project's issue tracker for known issues
- Contact your team Product Owner for access issues

---

## Document Version

| Attribute             | Value        |
| --------------------- | ------------ |
| **Version**           | 1.0          |
| **Last Updated**      | January 2026 |
| **Scrumooth Version** | 1.x          |

---

**Ready to get started?** Head to the [Getting Started Guide](./getting-started/README.md) to begin your Scrumooth journey.
