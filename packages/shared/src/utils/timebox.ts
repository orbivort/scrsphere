// Shared Scrum event timebox derivation.
//
// Grounded in the November 2020 Scrum Guide, which assigns every event a
// maximum timebox: Sprint Planning (max 8h for a one-month Sprint, scaled
// proportionally for shorter Sprints), Daily Scrum (15 min, fixed), Sprint
// Review (max 4h for a one-month Sprint, scaled), and Sprint Retrospective
// (max 3h for a one-month Sprint, scaled).
//
// Timeboxes are maximums, not targets: the tool surfaces the remaining time
// so the Scrum Master can keep the event within its timebox and the team can
// self-manage. It never hard-stops an event.

/** The four Scrum events that carry a timebox. */
export type ScrumEvent = 'sprintPlanning' | 'dailyScrum' | 'sprintReview' | 'retrospective';

/** Named constants for the Scrum event timebox types. */
export const SCRUM_EVENTS = {
  sprintPlanning: 'sprintPlanning' as const,
  dailyScrum: 'dailyScrum' as const,
  sprintReview: 'sprintReview' as const,
  retrospective: 'retrospective' as const,
} satisfies Record<ScrumEvent, ScrumEvent>;

/**
 * Maximum timebox in seconds for a one-month (four-week) Sprint.
 * Daily Scrum is not scaled by Sprint length.
 */
export const TIMBOX_MAX_SECONDS: Record<Exclude<ScrumEvent, 'dailyScrum'>, number> & {
  dailyScrum: number;
} = {
  dailyScrum: 15 * 60, // 15 minutes — fixed
  sprintPlanning: 8 * 60 * 60, // 8 hours
  sprintReview: 4 * 60 * 60, // 4 hours
  retrospective: 3 * 60 * 60, // 3 hours
};

/** The number of weeks treated as a full one-month Sprint (scale factor 1.0). */
const FULL_SPRINT_WEEKS = 4;

/**
 * Derive an event's timebox in seconds given the configured Sprint length in
 * weeks, using a strict linear scale: the one-month maximum is scaled linearly
 * by the ratio of the Sprint length to four weeks (never a hardcoded per-week
 * lookup table). Month-scaled events (Planning, Review, Retrospective) scale
 * proportionally from their one-month maximum and cap at one month. Daily
 * Scrum always returns the fixed 15 minutes regardless of Sprint length.
 */
export const timeboxFor = (event: ScrumEvent, sprintWeeks: number): number => {
  if (event === 'dailyScrum') {
    return TIMBOX_MAX_SECONDS.dailyScrum;
  }

  const scale = Math.max(0, Math.min(sprintWeeks, FULL_SPRINT_WEEKS)) / FULL_SPRINT_WEEKS;
  return Math.round(TIMBOX_MAX_SECONDS[event] * scale);
};

/**
 * Pre-warning threshold as a fraction of the timebox remaining at which the
 * timer should begin signaling the approaching limit (e.g. 10% of time left).
 */
export const TIMBOX_WARNING_FRACTION = 0.1;
