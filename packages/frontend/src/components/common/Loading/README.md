# LoadingState Component

A unified loading state component that supports multiple loading variants for different use cases throughout the application.

## Table of Contents

- [Quick Start](#quick-start)
- [Decision Matrix](#decision-matrix)
- [Variants](#variants)
  - [Spinner](#spinner-variant)
  - [Skeleton Text](#skeleton-text-variant)
  - [Skeleton Card](#skeleton-card-variant)
  - [Skeleton List](#skeleton-list-variant)
  - [Page Loader](#page-variant)
- [Props Reference](#props-reference)
- [Accessibility](#accessibility)
- [Best Practices](#best-practices)

---

## Quick Start

```tsx
import { LoadingState } from '@/components/common/Loading';

// Basic spinner
<LoadingState variant="spinner" />

// Skeleton for text content
<LoadingState variant="skeleton-text" lines={3} />

// Full-page loader
<LoadingState variant="page" fullScreen label="Loading application..." />
```

---

## Decision Matrix

Use this table to choose the appropriate loading variant for your scenario:

| Scenario                      | Recommended Variant | Props                   | Rationale                                        |
| ----------------------------- | ------------------- | ----------------------- | ------------------------------------------------ |
| Button loading                | `spinner`           | `size="sm"`             | Inline, doesn't shift layout, fits within button |
| Form submission               | `spinner`           | `size="md"`             | Clear action feedback, centered in form area     |
| Page initial load             | `page`              | `fullScreen`            | Full context, reduces perceived wait time        |
| Card content loading          | `skeleton-card`     | `cardVariant="default"` | Matches final layout, reduces CLS                |
| Dashboard stats               | `skeleton-card`     | `cardVariant="stats"`   | Matches stats card layout with icons             |
| List loading (tasks, backlog) | `skeleton-list`     | `itemCount={5}`         | Matches list structure, consistent item height   |
| Text content loading          | `skeleton-text`     | `lines={3}`             | Matches text layout, natural reading flow        |
| Chart loading                 | `skeleton-chart`    | (standalone)            | Matches chart area dimensions                    |

---

## Variants

### Spinner Variant

The `spinner` variant displays an animated loading spinner. Use for inline loading states where you need a compact indicator.

**When to use:**

- Button loading states
- Form submission feedback
- Inline content loading
- Quick data fetches

**Examples:**

```tsx
// Small spinner for buttons
<LoadingState
  variant="spinner"
  size="sm"
  label="Saving..."
/>

// Medium spinner for form areas (default size)
<LoadingState
  variant="spinner"
  label="Loading data..."
/>

// Large spinner for prominent loading areas
<LoadingState
  variant="spinner"
  size="lg"
  label="Processing your request..."
/>
```

**Button Integration Example:**

```tsx
function SubmitButton({ isSubmitting }: { isSubmitting: boolean }) {
  return (
    <button disabled={isSubmitting}>
      {isSubmitting ? <LoadingState variant="spinner" size="sm" label="Submitting..." /> : 'Submit'}
    </button>
  );
}
```

---

### Skeleton Text Variant

The `skeleton-text` variant displays placeholder lines that mimic text content. Use when loading articles, descriptions, or any text-heavy content.

**When to use:**

- Article content loading
- Description text loading
- Paragraph placeholders
- Documentation loading

**Examples:**

```tsx
// Single line skeleton
<LoadingState
  variant="skeleton-text"
  lines={1}
  label="Loading title"
/>

// Multi-line text with partial last line
<LoadingState
  variant="skeleton-text"
  lines={3}
  lastLineWidth="60%"
  label="Loading article content"
/>

// Long article placeholder
<LoadingState
  variant="skeleton-text"
  lines={8}
  lastLineWidth="40%"
  label="Loading full article"
/>
```

**Article Loading Example:**

```tsx
function ArticleContent({ article, isLoading }: ArticleProps) {
  if (isLoading) {
    return (
      <article>
        <LoadingState
          variant="skeleton-text"
          lines={12}
          lastLineWidth="35%"
          label="Loading article content"
        />
      </article>
    );
  }

  return <article>{article.content}</article>;
}
```

---

### Skeleton Card Variant

The `skeleton-card` variant displays placeholder cards that match the final card layout. Supports multiple card types through the `cardVariant` prop.

**When to use:**

- Dashboard card loading
- Stats card loading
- List card loading
- Feature card loading

**Card Variants:**

| cardVariant | Description                     | Use Case             |
| ----------- | ------------------------------- | -------------------- |
| `default`   | Standard card with list items   | Generic card content |
| `list`      | Card optimized for list display | Task lists, backlogs |
| `stats`     | Card with stat items and icons  | Dashboard statistics |

**Examples:**

```tsx
// Default card skeleton
<LoadingState
  variant="skeleton-card"
  itemCount={3}
  label="Loading card content"
/>

// Stats card skeleton for dashboards
<LoadingState
  variant="skeleton-card"
  cardVariant="stats"
  itemCount={3}
  label="Loading statistics"
/>

// Multiple cards for dashboard
<LoadingState
  variant="skeleton-card"
  cardVariant="stats"
  itemCount={4}
  label="Loading dashboard stats"
/>
```

**Dashboard Loading Example:**

```tsx
function DashboardStats({ stats, isLoading }: DashboardProps) {
  if (isLoading) {
    return (
      <div className="dashboard-grid">
        <LoadingState
          variant="skeleton-card"
          cardVariant="stats"
          itemCount={3}
          label="Loading statistics"
        />
      </div>
    );
  }

  return <StatsGrid stats={stats} />;
}
```

---

### Skeleton List Variant

The `skeleton-list` variant displays placeholder list items. Each item includes a dot, line, and badge placeholder to match typical list item structure.

**When to use:**

- Task list loading
- Backlog item loading
- Navigation list loading
- Any list-based content

**Examples:**

```tsx
// Default list (3 items)
<LoadingState
  variant="skeleton-list"
  label="Loading items"
/>

// Task list with 5 items
<LoadingState
  variant="skeleton-list"
  itemCount={5}
  label="Loading tasks"
/>

// Long list loading
<LoadingState
  variant="skeleton-list"
  itemCount={10}
  label="Loading backlog items"
/>
```

**Task List Loading Example:**

```tsx
function TaskList({ tasks, isLoading }: TaskListProps) {
  if (isLoading) {
    return (
      <div className="task-list">
        <LoadingState variant="skeleton-list" itemCount={5} label="Loading tasks" />
      </div>
    );
  }

  return (
    <ul>
      {tasks.map((task) => (
        <TaskItem key={task.id} task={task} />
      ))}
    </ul>
  );
}
```

---

### Page Variant

The `page` variant displays a full-page loading indicator with an optional text label. Use for page-level loading states.

**When to use:**

- Initial page load
- Route transitions
- Full application loading
- Authentication redirects

**Examples:**

```tsx
// Centered page loader
<LoadingState
  variant="page"
  label="Loading dashboard..."
/>

// Full-screen overlay loader
<LoadingState
  variant="page"
  fullScreen
  label="Loading application..."
/>

// Large page loader
<LoadingState
  variant="page"
  size="lg"
  label="Initializing workspace..."
/>
```

**Page Loading Example:**

```tsx
function DashboardPage() {
  const { data, isLoading, error } = useDashboardData();

  if (isLoading) {
    return <LoadingState variant="page" fullScreen label="Loading dashboard..." />;
  }

  if (error) {
    return <ErrorState error={error} />;
  }

  return <Dashboard data={data} />;
}
```

---

## Props Reference

### LoadingStateProps

| Prop            | Type                  | Default        | Description                                                                                                       |
| --------------- | --------------------- | -------------- | ----------------------------------------------------------------------------------------------------------------- |
| `variant`       | `LoadingVariant`      | **required**   | Type of loading indicator: `'spinner'` \| `'skeleton-text'` \| `'skeleton-card'` \| `'skeleton-list'` \| `'page'` |
| `size`          | `LoadingSize`         | `'md'`         | Size of loading indicator: `'sm'` \| `'md'` \| `'lg'` (for spinner and page variants)                             |
| `label`         | `string`              | `'Loading...'` | Accessible label for screen readers                                                                               |
| `className`     | `string`              | `''`           | Additional CSS class name                                                                                         |
| `lines`         | `number`              | `3`            | Number of skeleton lines (for `skeleton-text` variant)                                                            |
| `lastLineWidth` | `string`              | `'100%'`       | Width of last line (for `skeleton-text` variant, e.g., `'60%'`, `'200px'`)                                        |
| `itemCount`     | `number`              | `3`            | Number of items to display (for `skeleton-list` and `skeleton-card` variants)                                     |
| `cardVariant`   | `SkeletonCardVariant` | `'default'`    | Type of card content: `'default'` \| `'list'` \| `'stats'` (for `skeleton-card` variant)                          |
| `fullScreen`    | `boolean`             | `false`        | Display as full-screen overlay (for `page` variant)                                                               |

### Type Definitions

```tsx
type LoadingVariant = 'spinner' | 'skeleton-text' | 'skeleton-card' | 'skeleton-list' | 'page';
type LoadingSize = 'sm' | 'md' | 'lg';
type SkeletonCardVariant = 'default' | 'list' | 'stats';
```

---

## Accessibility

The LoadingState component is built with accessibility in mind. Here are the built-in features and best practices:

### Built-in Accessibility Features

1. **ARIA Attributes**: All variants include proper ARIA attributes:
   - `role="status"` - Indicates a status message
   - `aria-live="polite"` - Non-intrusive announcements
   - `aria-busy="true"` - Indicates loading state
   - `aria-label` - Descriptive label for screen readers

2. **Visually Hidden Text**: Skeleton components include visually hidden text for screen readers.

3. **Reduced Motion Support**: Animations respect `prefers-reduced-motion` media query.

### Accessibility Best Practices

#### 1. Always Provide Meaningful Labels

```tsx
// Good - descriptive label
<LoadingState
  variant="skeleton-list"
  itemCount={5}
  label="Loading your assigned tasks"
/>

// Bad - generic label
<LoadingState
  variant="skeleton-list"
  itemCount={5}
  label="Loading..."
/>
```

#### 2. Match Loading State to Content Structure

Ensure skeleton placeholders match the final content structure to reduce Cumulative Layout Shift (CLS):

```tsx
// Good - skeleton matches final layout
function TaskBoard({ tasks, isLoading }) {
  if (isLoading) {
    return (
      <div className="task-columns">
        <div className="column">
          <LoadingState variant="skeleton-list" itemCount={3} label="Loading todo tasks" />
        </div>
        <div className="column">
          <LoadingState variant="skeleton-list" itemCount={3} label="Loading in-progress tasks" />
        </div>
      </div>
    );
  }

  return <TaskColumns tasks={tasks} />;
}
```

#### 3. Use aria-live="polite" for Non-Critical Updates

The component uses `aria-live="polite"` by default, which is appropriate for most loading states. This ensures screen readers announce changes without interrupting the user.

#### 4. Test with Screen Readers

Test your loading states with popular screen readers:

- **NVDA** (Windows, free)
- **VoiceOver** (macOS/iOS, built-in)
- **JAWS** (Windows, commercial)

#### 5. Respect User Preferences

The component automatically respects `prefers-reduced-motion`. For custom implementations:

```css
@media (prefers-reduced-motion: reduce) {
  .skeleton-line,
  .skeleton-title,
  .skeleton-badge {
    animation: none;
  }
}
```

---

## Best Practices

### 1. Choose the Right Variant

Select variants based on the content being loaded:

```tsx
// Text content -> skeleton-text
<ArticleLoader>
  <LoadingState variant="skeleton-text" lines={8} />
</ArticleLoader>

// List items -> skeleton-list
<TaskLoader>
  <LoadingState variant="skeleton-list" itemCount={5} />
</TaskLoader>

// Dashboard cards -> skeleton-card with stats variant
<DashboardLoader>
  <LoadingState variant="skeleton-card" cardVariant="stats" itemCount={3} />
</DashboardLoader>
```

### 2. Maintain Layout Consistency

Ensure loading states don't cause layout shifts:

```tsx
// Good - container maintains dimensions
function Card({ data, isLoading }) {
  return (
    <div className="card" style={{ minHeight: '200px' }}>
      {isLoading ? <LoadingState variant="skeleton-card" /> : <CardContent data={data} />}
    </div>
  );
}
```

### 3. Use Appropriate Sizes

```tsx
// Buttons: small spinner
<button>
  <LoadingState variant="spinner" size="sm" label="Saving..." />
</button>

// Forms/Sections: medium spinner (default)
<section>
  <LoadingState variant="spinner" label="Loading form..." />
</section>

// Full-page: large spinner
<LoadingState variant="page" size="lg" label="Loading application..." />
```

### 4. Provide Context in Labels

```tsx
// Context-specific labels
<LoadingState variant="skeleton-list" label="Loading your assigned tasks" />
<LoadingState variant="skeleton-card" label="Loading project statistics" />
<LoadingState variant="page" label="Initializing your workspace" />
```

### 5. Handle Loading States Gracefully

```tsx
function DataComponent() {
  const { data, isLoading, error } = useData();

  // Show loading state
  if (isLoading) {
    return <LoadingState variant="skeleton-card" label="Loading data" />;
  }

  // Show error state
  if (error) {
    return <ErrorState error={error} />;
  }

  // Show content
  return <Content data={data} />;
}
```

---

## Standalone Skeleton Components

For advanced use cases, you can use the skeleton components directly:

### SkeletonChart

```tsx
import { SkeletonChart } from '@/components/common/Loading';

// Standalone chart skeleton
<SkeletonChart label="Loading performance chart" />;
```

### Direct Component Usage

```tsx
import {
  SkeletonText,
  SkeletonList,
  SkeletonCard,
  SkeletonChart,
} from '@/components/common/Loading';

// Custom skeleton layouts
<div className="custom-layout">
  <SkeletonText lines={2} label="Loading header" />
  <SkeletonList itemCount={3} label="Loading items" />
  <SkeletonChart label="Loading chart" />
</div>;
```

---

## Migrated Pages

The following pages have been successfully migrated to use the LoadingState component:

### Main Pages

- **Dashboard.tsx** - Page-level loading with `variant="page"`
- **DailyScrum.tsx** - Skeleton loading for daily updates
- **SprintReview.tsx** - Spinner for sprint review loading
- **SprintReviewList.tsx** - Page-level loading for sprint list
- **Retrospective.tsx** - Page-level loading for retrospectives
- **RetrospectiveList.tsx** - Page-level loading for retrospective list
- **ProductGoals.tsx** - Page-level loading for product goals
- **Notifications.tsx** - Page-level loading for notifications
- **Impediments.tsx** - Page-level loading and button spinners

### Increment Pages

- **IncrementList.tsx** - Page-level loading for increment list
- **IncrementCreate.tsx** - Page-level loading and button spinners for create/deliver actions
- **IncrementDetail.tsx** - Page-level loading and button spinner for deliver action

### Settings Pages

- **DefinitionOfDonePanel.tsx** - Spinner for DoD panel loading
- **DefinitionOfReadyPanel.tsx** - Spinner for DoR panel loading

### Backlog Pages

- **PendingRetroActionItems.tsx** - Skeleton list for action items
- **PendingFeedback.tsx** - Skeleton list for feedback
- **PendingAdjustments.tsx** - Skeleton list for adjustments

### Components

- **DoDVerificationModal.tsx** - Spinner for verification status
- **StatusSelector.tsx** - Small spinner for status updates

### Migration Benefits

- ✅ **Consistency**: All pages now use the same loading patterns
- ✅ **Accessibility**: All loading states are WCAG 2.2 AA compliant
- ✅ **Maintainability**: Single source of truth for loading components
- ✅ **User Experience**: Reduced cognitive load with predictable loading patterns
- ✅ **Code Quality**: Removed duplicate loading implementations

---

## Related Components

- [`LoadingSpinner`](../Page/LoadingSpinner.tsx) - The underlying spinner component
- [`ErrorState`](../ErrorState) - For error handling states
- [`EmptyState`](../EmptyState) - For empty data states
