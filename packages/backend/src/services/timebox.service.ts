// Timebox Service
//
// Persists and shares Scrum event timebox state so every participant sees the
// same clock (Transparency pillar of the Scrum Guide). The timer never blocks
// or terminates an event — it surfaces remaining time so the Scrum Master can
// keep the event within its timebox and the team can self-manage.
//
// State machine:
//   IDLE    -> RUNNING  (start)
//   PAUSED  -> RUNNING  (resume/start)
//   RUNNING -> PAUSED   (pause)
//   *       -> IDLE     (reset)
//
// `accumulatedMs` holds the elapsed time already banked before the current run;
// while RUNNING, total elapsed = accumulatedMs + (now - startedAt).
import prisma from '../utils/prisma';
import { generateUUIDv7 } from '../utils/uuid';
import { auditResourceEvent } from '../utils/auditLogger';
import { logger } from '../utils/logger';
import {
  timeboxFor,
  type ScrumEvent,
  type TimeboxState,
  type TimeboxStatus,
} from '@scrumooth/shared';

interface TimeboxKey {
  teamId: string;
  eventType: ScrumEvent;
  sprintId: string | null;
  date: string;
}

/**
 * Resolve a sprint identifier to a real `Sprint.id` (or null).
 *
 * Sprint Planning passes the *GeneratedSprint* id (the pre-generated planning
 * records) as the sprint key. A GeneratedSprint is only linked to a real
 * `Sprint` row once it is materialized (during draft save / start), so its own
 * id cannot be used directly as the `timeboxes.sprintId` FK — doing so violates
 * `timeboxes_sprintId_fkey`. We therefore map a GeneratedSprint id to its
 * materialized `Sprint.id` when available, and fall back to null otherwise so a
 * team event timebox is still usable before the sprint is started.
 */
const resolveSprintId = async (sprintId: string | null): Promise<string | null> => {
  if (!sprintId) return null;

  const real = await prisma.sprint.findUnique({ where: { id: sprintId }, select: { id: true } });
  if (real) return real.id;

  const generated = await prisma.generatedSprint.findUnique({
    where: { id: sprintId },
    select: { sprintId: true },
  });
  return generated?.sprintId ?? null;
};

/**
 * Resolve the timebox row for the key, creating an initial IDLE row on first
 * access so a GET always returns a usable state even before any control action.
 */
const resolveTimebox = async (key: TimeboxKey) => {
  const sprintId = await resolveSprintId(key.sprintId ?? null);
  const date = new Date(key.date);
  date.setHours(0, 0, 0, 0);

  const existing = await prisma.timebox.findFirst({
    where: {
      teamId: key.teamId,
      eventType: key.eventType,
      sprintId,
      date,
    },
  });

  if (existing) {
    return { row: existing, created: false };
  }

  try {
    const row = await prisma.timebox.create({
      data: {
        id: generateUUIDv7(),
        teamId: key.teamId,
        eventType: key.eventType,
        sprintId,
        date,
        status: 'IDLE',
        accumulatedMs: 0,
        version: 0,
      },
    });

    return { row, created: true };
  } catch (error) {
    // Two concurrent requests may race to create the initial row; the unique
    // constraint rejects the second. Re-read and return the winner.
    if (error instanceof Error && 'code' in error && error.code === 'P2002') {
      const row = await prisma.timebox.findFirst({
        where: {
          teamId: key.teamId,
          eventType: key.eventType,
          sprintId,
          date,
        },
      });
      if (row) {
        return { row, created: false };
      }
    }
    throw error;
  }
};

/** Compute total elapsed milliseconds for a row at the current instant. */
const computeElapsed = (row: {
  status: TimeboxStatus;
  startedAt: Date | null;
  pausedAt: Date | null;
  accumulatedMs: number;
}): number => {
  if (row.status === 'RUNNING' && row.startedAt) {
    return row.accumulatedMs + (Date.now() - row.startedAt.getTime());
  }
  return row.accumulatedMs;
};

/**
 * Derive the timebox scale factor (sprint length in weeks) for a sprint key.
 *
 * The Sprint Planning page passes a *GeneratedSprint* id, which may or may not
 * be materialized into a real `Sprint` row. To keep the timebox correct in both
 * cases we read the date range from whichever record exists: the materialized
 * `Sprint` first (it reflects the actual, possibly adjusted dates), then the
 * `GeneratedSprint` (so a still-planned sprint scales by its planned duration).
 */
const resolveSprintWeeks = async (sprintId: string | null): Promise<number> => {
  let startDate: Date | null = null;
  let endDate: Date | null = null;

  if (sprintId) {
    const sprint = await prisma.sprint.findUnique({
      where: { id: sprintId },
      select: { startDate: true, endDate: true },
    });
    if (sprint) {
      startDate = sprint.startDate;
      endDate = sprint.endDate;
    } else {
      const generated = await prisma.generatedSprint.findUnique({
        where: { id: sprintId },
        select: { startDate: true, endDate: true },
      });
      if (generated) {
        startDate = generated.startDate;
        endDate = generated.endDate;
      }
    }
  }

  if (startDate && endDate) {
    const ms = endDate.getTime() - startDate.getTime();
    return Math.max(1, Math.round(ms / (7 * 24 * 60 * 60 * 1000)));
  }
  return 4;
};

/** Build the public state shape for a row and its sprint length. */
const toState = async (
  row: Awaited<ReturnType<typeof resolveTimebox>>['row'],
  eventType: ScrumEvent,
  sprintKey: string | null
): Promise<TimeboxState> => {
  const sprintWeeks = await resolveSprintWeeks(sprintKey);

  return {
    teamId: row.teamId,
    eventType,
    sprintId: row.sprintId,
    date: row.date.toISOString(),
    status: row.status,
    elapsedMs: computeElapsed(row),
    timeboxSeconds: timeboxFor(eventType, sprintWeeks),
    version: row.version,
  };
};

export const timeboxService = {
  /**
   * Read the current timebox state for an event. Creates an initial IDLE row if
   * none exists yet. Open to all team members (view-only transparency).
   */
  async getTimebox(key: TimeboxKey): Promise<TimeboxState> {
    const { row } = await resolveTimebox(key);
    return toState(row, key.eventType, key.sprintId);
  },

  /** Start (or resume) the timebox. Scrum Master only. */
  async start(key: TimeboxKey, userId: string): Promise<TimeboxState> {
    const { row } = await resolveTimebox(key);
    const now = new Date();

    const updated = await prisma.timebox.update({
      where: { id: row.id },
      data: {
        status: 'RUNNING',
        startedAt: now,
        pausedAt: null,
        version: { increment: 1 },
        updatedBy: userId,
      },
    });

    auditResourceEvent(
      'TIMEBOX',
      'START',
      'SUCCESS',
      { type: 'TIMEBOX', id: row.id, name: key.eventType },
      { teamId: key.teamId, sprintId: row.sprintId }
    );
    logger.debug('Timebox started', { id: row.id, eventType: key.eventType });
    return toState(updated, key.eventType, key.sprintId);
  },

  /** Pause the running timebox, banking the elapsed run. Scrum Master only. */
  async pause(key: TimeboxKey, userId: string): Promise<TimeboxState> {
    const { row } = await resolveTimebox(key);

    if (row.status !== 'RUNNING') {
      return toState(row, key.eventType, key.sprintId);
    }

    const accumulatedMs = computeElapsed(row);
    const updated = await prisma.timebox.update({
      where: { id: row.id },
      data: {
        status: 'PAUSED',
        pausedAt: new Date(),
        startedAt: null,
        accumulatedMs,
        version: { increment: 1 },
        updatedBy: userId,
      },
    });

    auditResourceEvent(
      'TIMEBOX',
      'PAUSE',
      'SUCCESS',
      { type: 'TIMEBOX', id: row.id, name: key.eventType },
      { teamId: key.teamId, sprintId: row.sprintId, elapsedMs: accumulatedMs }
    );
    logger.debug('Timebox paused', { id: row.id, eventType: key.eventType });
    return toState(updated, key.eventType, key.sprintId);
  },

  /** Reset the timebox back to IDLE. Scrum Master only. */
  async reset(key: TimeboxKey, userId: string): Promise<TimeboxState> {
    const { row } = await resolveTimebox(key);

    const updated = await prisma.timebox.update({
      where: { id: row.id },
      data: {
        status: 'IDLE',
        startedAt: null,
        pausedAt: null,
        accumulatedMs: 0,
        version: { increment: 1 },
        updatedBy: userId,
      },
    });

    auditResourceEvent(
      'TIMEBOX',
      'RESET',
      'SUCCESS',
      { type: 'TIMEBOX', id: row.id, name: key.eventType },
      { teamId: key.teamId, sprintId: row.sprintId }
    );
    logger.debug('Timebox reset', { id: row.id, eventType: key.eventType });
    return toState(updated, key.eventType, key.sprintId);
  },

  /**
   * Record the actual-vs-timebox outcome when an event concludes, so it can be
   * inspected during the Sprint Retrospective (Inspection/Adaptation pillar).
   * Sets the status to PAUSED and stores the elapsed duration at conclusion.
   */
  async conclude(key: TimeboxKey, userId: string): Promise<TimeboxState> {
    const { row } = await resolveTimebox(key);
    const elapsedMs = computeElapsed(row);

    const updated = await prisma.timebox.update({
      where: { id: row.id },
      data: {
        status: 'PAUSED',
        startedAt: null,
        pausedAt: null,
        accumulatedMs: elapsedMs,
        concludedAt: new Date(),
        concludedElapsedMs: elapsedMs,
        version: { increment: 1 },
        updatedBy: userId,
      },
    });

    auditResourceEvent(
      'TIMEBOX',
      'CONCLUDE',
      'SUCCESS',
      { type: 'TIMEBOX', id: row.id, name: key.eventType },
      { teamId: key.teamId, sprintId: row.sprintId, elapsedMs }
    );
    logger.debug('Timebox concluded', { id: row.id, eventType: key.eventType, elapsedMs });
    return toState(updated, key.eventType, key.sprintId);
  },
};
