import { describe, it, expect } from 'vitest';
import { TIMBOX_MAX_SECONDS, TIMBOX_WARNING_FRACTION, timeboxFor } from '../../utils/timebox.js';

describe('timeboxFor', () => {
  describe('one-month (four-week) Sprint caps', () => {
    it('returns 8 hours for Sprint Planning', () => {
      expect(timeboxFor('sprintPlanning', 4)).toBe(8 * 60 * 60);
    });

    it('returns 4 hours for Sprint Review', () => {
      expect(timeboxFor('sprintReview', 4)).toBe(4 * 60 * 60);
    });

    it('returns 3 hours for Sprint Retrospective', () => {
      expect(timeboxFor('retrospective', 4)).toBe(3 * 60 * 60);
    });

    it('returns fixed 15 minutes for Daily Scrum', () => {
      expect(timeboxFor('dailyScrum', 4)).toBe(15 * 60);
    });
  });

  describe('proportional scaling for shorter Sprints', () => {
    it('halves month-scaled events for a two-week Sprint', () => {
      expect(timeboxFor('sprintPlanning', 2)).toBe(4 * 60 * 60);
      expect(timeboxFor('sprintReview', 2)).toBe(2 * 60 * 60);
      expect(timeboxFor('retrospective', 2)).toBe((3 * 60 * 60) / 2);
    });

    it('quarters month-scaled events for a one-week Sprint', () => {
      expect(timeboxFor('sprintPlanning', 1)).toBe(2 * 60 * 60);
      expect(timeboxFor('sprintReview', 1)).toBe(1 * 60 * 60);
      expect(timeboxFor('retrospective', 1)).toBe((3 * 60 * 60) / 4);
    });

    it('keeps Daily Scrum fixed regardless of Sprint length', () => {
      expect(timeboxFor('dailyScrum', 1)).toBe(15 * 60);
      expect(timeboxFor('dailyScrum', 2)).toBe(15 * 60);
    });
  });

  describe('edge cases', () => {
    it('caps at one month for longer Sprints', () => {
      expect(timeboxFor('sprintPlanning', 8)).toBe(8 * 60 * 60);
    });

    it('scales three-week Sprints to 3/4 of one month', () => {
      expect(timeboxFor('sprintPlanning', 3)).toBe(6 * 60 * 60);
      expect(timeboxFor('sprintReview', 3)).toBe(3 * 60 * 60);
    });

    it('handles a zero-length Sprint without negative timeboxes', () => {
      expect(timeboxFor('sprintPlanning', 0)).toBe(0);
      expect(timeboxFor('dailyScrum', 0)).toBe(15 * 60);
    });
  });
});

describe('TIMBOX_MAX_SECONDS', () => {
  it('exposes the Scrum Guide one-month maximums', () => {
    expect(TIMBOX_MAX_SECONDS.sprintPlanning).toBe(8 * 60 * 60);
    expect(TIMBOX_MAX_SECONDS.dailyScrum).toBe(15 * 60);
    expect(TIMBOX_MAX_SECONDS.sprintReview).toBe(4 * 60 * 60);
    expect(TIMBOX_MAX_SECONDS.retrospective).toBe(3 * 60 * 60);
  });
});

describe('TIMBOX_WARNING_FRACTION', () => {
  it('is a positive fraction used as the pre-warning threshold', () => {
    expect(TIMBOX_WARNING_FRACTION).toBeGreaterThan(0);
    expect(TIMBOX_WARNING_FRACTION).toBeLessThan(1);
  });
});
