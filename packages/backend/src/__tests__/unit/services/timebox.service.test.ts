import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';

// Hoisted mocks must not reference outer-scope variables.
vi.mock('../../../utils/prisma', () => ({
  default: {
    timebox: {
      findFirst: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
    sprint: {
      findUnique: vi.fn(),
    },
    generatedSprint: {
      findUnique: vi.fn(),
    },
  },
}));

vi.mock('../../../utils/uuid', () => ({
  generateUUIDv7: vi.fn().mockReturnValue('test-uuid'),
}));

import prisma from '../../../utils/prisma';
import { timeboxService } from '../../../services/timebox.service';
import type { TimeboxStatus } from '@scrumooth/shared';

const p = prisma as unknown as {
  timebox: {
    findFirst: ReturnType<typeof vi.fn>;
    create: ReturnType<typeof vi.fn>;
    update: ReturnType<typeof vi.fn>;
  };
  sprint: { findUnique: ReturnType<typeof vi.fn> };
  generatedSprint: { findUnique: ReturnType<typeof vi.fn> };
};

const baseKey = {
  teamId: 'team-1',
  eventType: 'dailyScrum' as const,
  sprintId: null as string | null,
  date: '2026-08-24',
};

const makeRow = (
  overrides: Partial<{
    id: string;
    teamId: string;
    eventType: string;
    sprintId: string | null;
    date: Date;
    status: TimeboxStatus;
    startedAt: Date | null;
    pausedAt: Date | null;
    accumulatedMs: number;
    version: number;
  }> = {}
) => ({
  id: 'tb-1',
  teamId: 'team-1',
  eventType: 'dailyScrum',
  sprintId: null,
  date: new Date('2026-08-24T00:00:00.000Z'),
  status: 'IDLE' as TimeboxStatus,
  startedAt: null,
  pausedAt: null,
  accumulatedMs: 0,
  version: 0,
  ...overrides,
});

describe('timeboxService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  // ---------------------------------------------------------------------------
  // resolveSprintId coverage (via getTimebox path)
  // ---------------------------------------------------------------------------
  describe('sprint id resolution', () => {
    it('passes null sprintId straight through without DB lookups', async () => {
      p.timebox.findFirst.mockResolvedValue(makeRow());

      const result = await timeboxService.getTimebox(baseKey);

      expect(p.sprint.findUnique).not.toHaveBeenCalled();
      expect(p.generatedSprint.findUnique).not.toHaveBeenCalled();
      expect(result.eventType).toBe('dailyScrum');
    });

    it('resolves a real Sprint id when the sprint row exists', async () => {
      p.sprint.findUnique.mockResolvedValue({ id: 'sprint-real' });
      p.timebox.findFirst.mockResolvedValue(makeRow({ sprintId: 'sprint-real' }));

      const result = await timeboxService.getTimebox({
        ...baseKey,
        sprintId: 'sprint-real',
      });

      expect(p.generatedSprint.findUnique).not.toHaveBeenCalled();
      expect(result.sprintId).toBe('sprint-real');
    });

    it('falls back to the GeneratedSprint materialized id when no real sprint', async () => {
      p.sprint.findUnique.mockResolvedValue(null);
      p.generatedSprint.findUnique.mockResolvedValue({ sprintId: 'sprint-mat' });
      p.timebox.findFirst.mockResolvedValue(makeRow({ sprintId: 'sprint-mat' }));

      const result = await timeboxService.getTimebox({
        ...baseKey,
        sprintId: 'gen-1',
      });

      expect(p.generatedSprint.findUnique).toHaveBeenCalledWith({
        where: { id: 'gen-1' },
        select: { sprintId: true },
      });
      expect(result.sprintId).toBe('sprint-mat');
    });

    it('falls back to null when neither sprint nor generated sprint exists', async () => {
      p.sprint.findUnique.mockResolvedValue(null);
      p.generatedSprint.findUnique.mockResolvedValue(null);
      p.timebox.findFirst.mockResolvedValue(makeRow({ sprintId: null }));

      const result = await timeboxService.getTimebox({
        ...baseKey,
        sprintId: 'unknown',
      });

      expect(result.sprintId).toBeNull();
    });
  });

  // ---------------------------------------------------------------------------
  // resolveTimebox: existing vs created vs P2002 race
  // ---------------------------------------------------------------------------
  describe('timebox row resolution', () => {
    it('returns the existing row without creating', async () => {
      const existing = makeRow({ id: 'existing-id', version: 3 });
      p.timebox.findFirst.mockResolvedValue(existing);

      const result = await timeboxService.getTimebox(baseKey);

      expect(p.timebox.create).not.toHaveBeenCalled();
      expect(result.version).toBe(3);
    });

    it('creates an initial IDLE row when none exists', async () => {
      p.timebox.findFirst.mockResolvedValue(null);
      const created = makeRow({ id: 'test-uuid', status: 'IDLE' });
      p.timebox.create.mockResolvedValue(created);

      const result = await timeboxService.getTimebox(baseKey);

      expect(p.timebox.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          id: 'test-uuid',
          teamId: 'team-1',
          eventType: 'dailyScrum',
          sprintId: null,
          status: 'IDLE',
          accumulatedMs: 0,
          version: 0,
        }),
      });
      expect(result.status).toBe('IDLE');
    });

    it('re-reads the winner row when a P2002 unique-constraint race occurs', async () => {
      p.timebox.findFirst
        .mockResolvedValueOnce(null) // first lookup: not found
        .mockResolvedValueOnce(makeRow({ id: 'winner' })); // re-read after race
      const raceError = Object.assign(new Error('Unique constraint'), {
        code: 'P2002',
      });
      p.timebox.create.mockRejectedValue(raceError);

      const result = await timeboxService.getTimebox(baseKey);

      expect(p.timebox.create).toHaveBeenCalledTimes(1);
      expect(result.version).toBe(0);
    });

    it('re-throws non-P2002 errors from create', async () => {
      p.timebox.findFirst.mockResolvedValue(null);
      p.timebox.create.mockRejectedValue(new Error('connection lost'));

      await expect(timeboxService.getTimebox(baseKey)).rejects.toThrow('connection lost');
    });

    it('re-throws when P2002 occurs but the re-read finds no row', async () => {
      p.timebox.findFirst.mockResolvedValue(null);
      const raceError = Object.assign(new Error('Unique constraint'), {
        code: 'P2002',
      });
      p.timebox.create.mockRejectedValue(raceError);

      await expect(timeboxService.getTimebox(baseKey)).rejects.toThrow('Unique constraint');
    });
  });

  // ---------------------------------------------------------------------------
  // computeElapsed branches
  // ---------------------------------------------------------------------------
  describe('elapsed computation', () => {
    it('returns accumulatedMs only when status is not RUNNING', async () => {
      p.timebox.findFirst.mockResolvedValue(makeRow({ status: 'PAUSED', accumulatedMs: 5000 }));

      const result = await timeboxService.getTimebox(baseKey);

      expect(result.elapsedMs).toBe(5000);
    });

    it('returns accumulatedMs only when RUNNING but startedAt is null', async () => {
      p.timebox.findFirst.mockResolvedValue(
        makeRow({ status: 'RUNNING', startedAt: null, accumulatedMs: 7000 })
      );

      const result = await timeboxService.getTimebox(baseKey);

      expect(result.elapsedMs).toBe(7000);
    });

    it('adds live elapsed time while RUNNING', async () => {
      vi.useFakeTimers();
      const now = new Date('2026-08-24T10:00:00.000Z').getTime();
      vi.setSystemTime(now);

      const startedAt = new Date(now - 3000); // started 3s ago
      p.timebox.findFirst.mockResolvedValue(
        makeRow({ status: 'RUNNING', startedAt, accumulatedMs: 2000 })
      );

      const result = await timeboxService.getTimebox(baseKey);

      expect(result.elapsedMs).toBe(5000); // 2000 + 3000
    });
  });

  // ---------------------------------------------------------------------------
  // resolveSprintWeeks branches (via timeboxSeconds output)
  // ---------------------------------------------------------------------------
  describe('sprint-week scaling', () => {
    it('returns default 4 weeks when no sprintId is provided', async () => {
      p.timebox.findFirst.mockResolvedValue(makeRow());

      const result = await timeboxService.getTimebox(baseKey);

      // dailyScrum is fixed at 15 min regardless of weeks.
      expect(result.timeboxSeconds).toBe(15 * 60);
    });

    it('reads weeks from the materialized Sprint date range', async () => {
      const start = new Date('2026-08-01T00:00:00.000Z');
      const end = new Date('2026-08-15T00:00:00.000Z'); // 14 days => 2 weeks
      p.sprint.findUnique.mockResolvedValue({ startDate: start, endDate: end });
      p.timebox.findFirst.mockResolvedValue(
        makeRow({ eventType: 'sprintPlanning', sprintId: 'sprint-1' })
      );

      const result = await timeboxService.getTimebox({
        ...baseKey,
        eventType: 'sprintPlanning',
        sprintId: 'sprint-1',
      });

      // 8h * (2/4) = 4h = 14400s
      expect(result.timeboxSeconds).toBe(4 * 60 * 60);
    });

    it('reads weeks from the GeneratedSprint when no real sprint', async () => {
      const start = new Date('2026-08-01T00:00:00.000Z');
      const end = new Date('2026-08-29T00:00:00.000Z'); // 28 days => 4 weeks
      p.sprint.findUnique.mockResolvedValue(null);
      p.generatedSprint.findUnique.mockResolvedValue({
        startDate: start,
        endDate: end,
      });
      p.timebox.findFirst.mockResolvedValue(
        makeRow({ eventType: 'retrospective', sprintId: 'gen-1' })
      );

      const result = await timeboxService.getTimebox({
        ...baseKey,
        eventType: 'retrospective',
        sprintId: 'gen-1',
      });

      // 3h at full 4-week scale
      expect(result.timeboxSeconds).toBe(3 * 60 * 60);
    });

    it('caps the scale at 4 weeks when the sprint is longer', async () => {
      const start = new Date('2026-08-01T00:00:00.000Z');
      const end = new Date('2026-12-01T00:00:00.000Z'); // far longer than 4 weeks
      p.sprint.findUnique.mockResolvedValue({ startDate: start, endDate: end });
      p.timebox.findFirst.mockResolvedValue(
        makeRow({ eventType: 'sprintReview', sprintId: 'sprint-1' })
      );

      const result = await timeboxService.getTimebox({
        ...baseKey,
        eventType: 'sprintReview',
        sprintId: 'sprint-1',
      });

      // capped at one-month max: 4h
      expect(result.timeboxSeconds).toBe(4 * 60 * 60);
    });

    it('falls back to default 4 weeks when generated sprint also missing', async () => {
      p.sprint.findUnique.mockResolvedValue(null);
      p.generatedSprint.findUnique.mockResolvedValue(null);
      p.timebox.findFirst.mockResolvedValue(
        makeRow({ eventType: 'sprintPlanning', sprintId: 'unknown' })
      );

      const result = await timeboxService.getTimebox({
        ...baseKey,
        eventType: 'sprintPlanning',
        sprintId: 'unknown',
      });

      // default 4 weeks => full 8h
      expect(result.timeboxSeconds).toBe(8 * 60 * 60);
    });

    it('falls back to default 4 weeks when sprint has no date range', async () => {
      p.sprint.findUnique.mockResolvedValue({ startDate: null, endDate: null });
      p.timebox.findFirst.mockResolvedValue(
        makeRow({ eventType: 'sprintPlanning', sprintId: 'sprint-1' })
      );

      const result = await timeboxService.getTimebox({
        ...baseKey,
        eventType: 'sprintPlanning',
        sprintId: 'sprint-1',
      });

      expect(result.timeboxSeconds).toBe(8 * 60 * 60);
    });

    it('returns at least 1 week for very short sprints', async () => {
      const start = new Date('2026-08-01T00:00:00.000Z');
      const end = new Date('2026-08-02T00:00:00.000Z'); // 1 day
      p.sprint.findUnique.mockResolvedValue({ startDate: start, endDate: end });
      p.timebox.findFirst.mockResolvedValue(
        makeRow({ eventType: 'sprintPlanning', sprintId: 'sprint-1' })
      );

      const result = await timeboxService.getTimebox({
        ...baseKey,
        eventType: 'sprintPlanning',
        sprintId: 'sprint-1',
      });

      // round(1day/7days)=0 -> Math.max(1,0)=1 week -> scale 1/4 -> 2h
      expect(result.timeboxSeconds).toBe(2 * 60 * 60);
    });
  });

  // ---------------------------------------------------------------------------
  // start
  // ---------------------------------------------------------------------------
  describe('start', () => {
    it('transitions an IDLE timebox to RUNNING', async () => {
      p.timebox.findFirst.mockResolvedValue(makeRow({ status: 'IDLE' }));
      const updated = makeRow({ status: 'RUNNING', startedAt: new Date(), version: 1 });
      p.timebox.update.mockResolvedValue(updated);

      const result = await timeboxService.start(baseKey, 'user-1');

      expect(p.timebox.update).toHaveBeenCalledWith({
        where: { id: 'tb-1' },
        data: expect.objectContaining({
          status: 'RUNNING',
          startedAt: expect.any(Date),
          pausedAt: null,
          version: { increment: 1 },
          updatedBy: 'user-1',
        }),
      });
      expect(result.status).toBe('RUNNING');
      expect(result.version).toBe(1);
    });

    it('resumes a PAUSED timebox to RUNNING', async () => {
      p.timebox.findFirst.mockResolvedValue(makeRow({ status: 'PAUSED', accumulatedMs: 9000 }));
      const updated = makeRow({ status: 'RUNNING', startedAt: new Date(), version: 2 });
      p.timebox.update.mockResolvedValue(updated);

      const result = await timeboxService.start(baseKey, 'user-1');

      expect(result.status).toBe('RUNNING');
    });
  });

  // ---------------------------------------------------------------------------
  // pause
  // ---------------------------------------------------------------------------
  describe('pause', () => {
    it('banks elapsed time and pauses a RUNNING timebox', async () => {
      vi.useFakeTimers();
      const now = new Date('2026-08-24T10:00:00.000Z').getTime();
      vi.setSystemTime(now);
      const startedAt = new Date(now - 4000);

      p.timebox.findFirst.mockResolvedValue(
        makeRow({ status: 'RUNNING', startedAt, accumulatedMs: 1000 })
      );
      const updated = makeRow({
        status: 'PAUSED',
        pausedAt: new Date(),
        startedAt: null,
        accumulatedMs: 5000,
        version: 1,
      });
      p.timebox.update.mockResolvedValue(updated);

      const result = await timeboxService.pause(baseKey, 'user-1');

      expect(p.timebox.update).toHaveBeenCalledWith({
        where: { id: 'tb-1' },
        data: expect.objectContaining({
          status: 'PAUSED',
          pausedAt: expect.any(Date),
          startedAt: null,
          accumulatedMs: 5000,
          version: { increment: 1 },
          updatedBy: 'user-1',
        }),
      });
      expect(result.status).toBe('PAUSED');
      expect(result.elapsedMs).toBe(5000);
    });

    it('returns the state unchanged when the timebox is not RUNNING', async () => {
      p.timebox.findFirst.mockResolvedValue(makeRow({ status: 'IDLE' }));

      const result = await timeboxService.pause(baseKey, 'user-1');

      expect(p.timebox.update).not.toHaveBeenCalled();
      expect(result.status).toBe('IDLE');
    });
  });

  // ---------------------------------------------------------------------------
  // reset
  // ---------------------------------------------------------------------------
  describe('reset', () => {
    it('returns the timebox to IDLE with zeroed counters', async () => {
      p.timebox.findFirst.mockResolvedValue(
        makeRow({ status: 'PAUSED', accumulatedMs: 12345, version: 4 })
      );
      const updated = makeRow({
        status: 'IDLE',
        startedAt: null,
        pausedAt: null,
        accumulatedMs: 0,
        version: 5,
      });
      p.timebox.update.mockResolvedValue(updated);

      const result = await timeboxService.reset(baseKey, 'user-1');

      expect(p.timebox.update).toHaveBeenCalledWith({
        where: { id: 'tb-1' },
        data: expect.objectContaining({
          status: 'IDLE',
          startedAt: null,
          pausedAt: null,
          accumulatedMs: 0,
          version: { increment: 1 },
          updatedBy: 'user-1',
        }),
      });
      expect(result.status).toBe('IDLE');
      expect(result.elapsedMs).toBe(0);
      expect(result.version).toBe(5);
    });
  });

  // ---------------------------------------------------------------------------
  // conclude
  // ---------------------------------------------------------------------------
  describe('conclude', () => {
    it('records the elapsed duration and sets PAUSED', async () => {
      vi.useFakeTimers();
      const now = new Date('2026-08-24T10:00:00.000Z').getTime();
      vi.setSystemTime(now);
      const startedAt = new Date(now - 6000);

      p.timebox.findFirst.mockResolvedValue(
        makeRow({ status: 'RUNNING', startedAt, accumulatedMs: 0 })
      );
      const updated = makeRow({
        status: 'PAUSED',
        startedAt: null,
        pausedAt: null,
        accumulatedMs: 6000,
        concludedAt: new Date(),
        concludedElapsedMs: 6000,
        version: 1,
      });
      p.timebox.update.mockResolvedValue(updated);

      const result = await timeboxService.conclude(baseKey, 'user-1');

      expect(p.timebox.update).toHaveBeenCalledWith({
        where: { id: 'tb-1' },
        data: expect.objectContaining({
          status: 'PAUSED',
          startedAt: null,
          pausedAt: null,
          accumulatedMs: 6000,
          concludedElapsedMs: 6000,
          version: { increment: 1 },
          updatedBy: 'user-1',
        }),
      });
      expect(result.status).toBe('PAUSED');
      expect(result.elapsedMs).toBe(6000);
    });

    it('banks previously accumulated elapsed when concluding an idle timebox', async () => {
      p.timebox.findFirst.mockResolvedValue(makeRow({ status: 'PAUSED', accumulatedMs: 4321 }));
      const updated = makeRow({
        status: 'PAUSED',
        accumulatedMs: 4321,
        concludedElapsedMs: 4321,
        version: 1,
      });
      p.timebox.update.mockResolvedValue(updated);

      const result = await timeboxService.conclude(baseKey, 'user-1');

      expect(result.elapsedMs).toBe(4321);
    });
  });
});
