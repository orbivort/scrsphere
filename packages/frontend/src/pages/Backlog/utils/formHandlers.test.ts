import { describe, it, expect, vi, beforeEach } from 'vitest';

import {
  handleMoscowKeyDown,
  getMoscowPriorityIndex,
  getNextMoscowPriority,
  getPreviousMoscowPriority,
} from './formHandlers';
import { MoSCoWPriority } from '../../../types';

describe('formHandlers', () => {
  describe('handleMoscowKeyDown', () => {
    let onPriorityChange: ReturnType<typeof vi.fn>;
    let mockEvent: React.KeyboardEvent;

    beforeEach(() => {
      onPriorityChange = vi.fn();
      mockEvent = {
        key: '',
        preventDefault: vi.fn(),
      } as unknown as React.KeyboardEvent;
    });

    describe('ArrowRight/ArrowDown Navigation', () => {
      it('should move to next priority on ArrowRight', () => {
        mockEvent.key = 'ArrowRight';

        handleMoscowKeyDown(mockEvent, 0, onPriorityChange);

        expect(mockEvent.preventDefault).toHaveBeenCalled();
        expect(onPriorityChange).toHaveBeenCalledWith(MoSCoWPriority.SHOULD_HAVE);
      });

      it('should move to next priority on ArrowDown', () => {
        mockEvent.key = 'ArrowDown';

        handleMoscowKeyDown(mockEvent, 0, onPriorityChange);

        expect(mockEvent.preventDefault).toHaveBeenCalled();
        expect(onPriorityChange).toHaveBeenCalledWith(MoSCoWPriority.SHOULD_HAVE);
      });

      it('should wrap around from last to first priority', () => {
        mockEvent.key = 'ArrowRight';

        handleMoscowKeyDown(mockEvent, 3, onPriorityChange);

        expect(onPriorityChange).toHaveBeenCalledWith(MoSCoWPriority.MUST_HAVE);
      });

      it('should navigate through all priorities in order', () => {
        mockEvent.key = 'ArrowRight';

        handleMoscowKeyDown(mockEvent, 0, onPriorityChange);
        expect(onPriorityChange).toHaveBeenLastCalledWith(MoSCoWPriority.SHOULD_HAVE);

        handleMoscowKeyDown(mockEvent, 1, onPriorityChange);
        expect(onPriorityChange).toHaveBeenLastCalledWith(MoSCoWPriority.COULD_HAVE);

        handleMoscowKeyDown(mockEvent, 2, onPriorityChange);
        expect(onPriorityChange).toHaveBeenLastCalledWith(MoSCoWPriority.WONT_HAVE);

        handleMoscowKeyDown(mockEvent, 3, onPriorityChange);
        expect(onPriorityChange).toHaveBeenLastCalledWith(MoSCoWPriority.MUST_HAVE);
      });
    });

    describe('ArrowLeft/ArrowUp Navigation', () => {
      it('should move to previous priority on ArrowLeft', () => {
        mockEvent.key = 'ArrowLeft';

        handleMoscowKeyDown(mockEvent, 1, onPriorityChange);

        expect(mockEvent.preventDefault).toHaveBeenCalled();
        expect(onPriorityChange).toHaveBeenCalledWith(MoSCoWPriority.MUST_HAVE);
      });

      it('should move to previous priority on ArrowUp', () => {
        mockEvent.key = 'ArrowUp';

        handleMoscowKeyDown(mockEvent, 1, onPriorityChange);

        expect(mockEvent.preventDefault).toHaveBeenCalled();
        expect(onPriorityChange).toHaveBeenCalledWith(MoSCoWPriority.MUST_HAVE);
      });

      it('should wrap around from first to last priority', () => {
        mockEvent.key = 'ArrowLeft';

        handleMoscowKeyDown(mockEvent, 0, onPriorityChange);

        expect(onPriorityChange).toHaveBeenCalledWith(MoSCoWPriority.WONT_HAVE);
      });

      it('should navigate backwards through all priorities', () => {
        mockEvent.key = 'ArrowLeft';

        handleMoscowKeyDown(mockEvent, 0, onPriorityChange);
        expect(onPriorityChange).toHaveBeenLastCalledWith(MoSCoWPriority.WONT_HAVE);

        handleMoscowKeyDown(mockEvent, 3, onPriorityChange);
        expect(onPriorityChange).toHaveBeenLastCalledWith(MoSCoWPriority.COULD_HAVE);

        handleMoscowKeyDown(mockEvent, 2, onPriorityChange);
        expect(onPriorityChange).toHaveBeenLastCalledWith(MoSCoWPriority.SHOULD_HAVE);

        handleMoscowKeyDown(mockEvent, 1, onPriorityChange);
        expect(onPriorityChange).toHaveBeenLastCalledWith(MoSCoWPriority.MUST_HAVE);
      });
    });

    describe('Home/End Keys', () => {
      it('should jump to first priority on Home', () => {
        mockEvent.key = 'Home';

        handleMoscowKeyDown(mockEvent, 2, onPriorityChange);

        expect(mockEvent.preventDefault).toHaveBeenCalled();
        expect(onPriorityChange).toHaveBeenCalledWith(MoSCoWPriority.MUST_HAVE);
      });

      it('should jump to last priority on End', () => {
        mockEvent.key = 'End';

        handleMoscowKeyDown(mockEvent, 0, onPriorityChange);

        expect(mockEvent.preventDefault).toHaveBeenCalled();
        expect(onPriorityChange).toHaveBeenCalledWith(MoSCoWPriority.WONT_HAVE);
      });

      it('should stay on first priority when Home pressed on first', () => {
        mockEvent.key = 'Home';

        handleMoscowKeyDown(mockEvent, 0, onPriorityChange);

        expect(onPriorityChange).toHaveBeenCalledWith(MoSCoWPriority.MUST_HAVE);
      });

      it('should stay on last priority when End pressed on last', () => {
        mockEvent.key = 'End';

        handleMoscowKeyDown(mockEvent, 3, onPriorityChange);

        expect(onPriorityChange).toHaveBeenCalledWith(MoSCoWPriority.WONT_HAVE);
      });
    });

    describe('Other Keys', () => {
      it('should not call onPriorityChange for other keys', () => {
        mockEvent.key = 'Enter';

        handleMoscowKeyDown(mockEvent, 0, onPriorityChange);

        expect(mockEvent.preventDefault).not.toHaveBeenCalled();
        expect(onPriorityChange).not.toHaveBeenCalled();
      });

      it('should not call onPriorityChange for Tab key', () => {
        mockEvent.key = 'Tab';

        handleMoscowKeyDown(mockEvent, 0, onPriorityChange);

        expect(mockEvent.preventDefault).not.toHaveBeenCalled();
        expect(onPriorityChange).not.toHaveBeenCalled();
      });

      it('should not call onPriorityChange for Space key', () => {
        mockEvent.key = ' ';

        handleMoscowKeyDown(mockEvent, 0, onPriorityChange);

        expect(mockEvent.preventDefault).not.toHaveBeenCalled();
        expect(onPriorityChange).not.toHaveBeenCalled();
      });
    });
  });

  describe('getMoscowPriorityIndex', () => {
    it('should return 0 for MUST_HAVE', () => {
      expect(getMoscowPriorityIndex(MoSCoWPriority.MUST_HAVE)).toBe(0);
    });

    it('should return 1 for SHOULD_HAVE', () => {
      expect(getMoscowPriorityIndex(MoSCoWPriority.SHOULD_HAVE)).toBe(1);
    });

    it('should return 2 for COULD_HAVE', () => {
      expect(getMoscowPriorityIndex(MoSCoWPriority.COULD_HAVE)).toBe(2);
    });

    it('should return 3 for WONT_HAVE', () => {
      expect(getMoscowPriorityIndex(MoSCoWPriority.WONT_HAVE)).toBe(3);
    });

    it('should return -1 for invalid priority', () => {
      expect(getMoscowPriorityIndex('INVALID' as MoSCoWPriority)).toBe(-1);
    });
  });

  describe('getNextMoscowPriority', () => {
    it('should return SHOULD_HAVE after MUST_HAVE', () => {
      expect(getNextMoscowPriority(MoSCoWPriority.MUST_HAVE)).toBe(MoSCoWPriority.SHOULD_HAVE);
    });

    it('should return COULD_HAVE after SHOULD_HAVE', () => {
      expect(getNextMoscowPriority(MoSCoWPriority.SHOULD_HAVE)).toBe(MoSCoWPriority.COULD_HAVE);
    });

    it('should return WONT_HAVE after COULD_HAVE', () => {
      expect(getNextMoscowPriority(MoSCoWPriority.COULD_HAVE)).toBe(MoSCoWPriority.WONT_HAVE);
    });

    it('should wrap around to MUST_HAVE after WONT_HAVE', () => {
      expect(getNextMoscowPriority(MoSCoWPriority.WONT_HAVE)).toBe(MoSCoWPriority.MUST_HAVE);
    });
  });

  describe('getPreviousMoscowPriority', () => {
    it('should wrap around to WONT_HAVE before MUST_HAVE', () => {
      expect(getPreviousMoscowPriority(MoSCoWPriority.MUST_HAVE)).toBe(MoSCoWPriority.WONT_HAVE);
    });

    it('should return MUST_HAVE before SHOULD_HAVE', () => {
      expect(getPreviousMoscowPriority(MoSCoWPriority.SHOULD_HAVE)).toBe(MoSCoWPriority.MUST_HAVE);
    });

    it('should return SHOULD_HAVE before COULD_HAVE', () => {
      expect(getPreviousMoscowPriority(MoSCoWPriority.COULD_HAVE)).toBe(MoSCoWPriority.SHOULD_HAVE);
    });

    it('should return COULD_HAVE before WONT_HAVE', () => {
      expect(getPreviousMoscowPriority(MoSCoWPriority.WONT_HAVE)).toBe(MoSCoWPriority.COULD_HAVE);
    });
  });

  describe('Priority Order Consistency', () => {
    it('should maintain consistent priority order', () => {
      const priorities = Object.values(MoSCoWPriority);

      expect(priorities[0]).toBe(MoSCoWPriority.MUST_HAVE);
      expect(priorities[1]).toBe(MoSCoWPriority.SHOULD_HAVE);
      expect(priorities[2]).toBe(MoSCoWPriority.COULD_HAVE);
      expect(priorities[3]).toBe(MoSCoWPriority.WONT_HAVE);
    });

    it('should have symmetrical next/previous navigation', () => {
      const priorities = Object.values(MoSCoWPriority);

      priorities.forEach((priority) => {
        const next = getNextMoscowPriority(priority);
        const previousOfNext = getPreviousMoscowPriority(next);

        expect(previousOfNext).toBe(priority);
      });
    });

    it('should navigate full cycle forward', () => {
      let current = MoSCoWPriority.MUST_HAVE;
      const visited: MoSCoWPriority[] = [current];

      for (let i = 0; i < 3; i++) {
        current = getNextMoscowPriority(current);
        visited.push(current);
      }

      expect(visited).toEqual([
        MoSCoWPriority.MUST_HAVE,
        MoSCoWPriority.SHOULD_HAVE,
        MoSCoWPriority.COULD_HAVE,
        MoSCoWPriority.WONT_HAVE,
      ]);

      expect(getNextMoscowPriority(current)).toBe(MoSCoWPriority.MUST_HAVE);
    });

    it('should navigate full cycle backward', () => {
      let current = MoSCoWPriority.WONT_HAVE;
      const visited: MoSCoWPriority[] = [current];

      for (let i = 0; i < 3; i++) {
        current = getPreviousMoscowPriority(current);
        visited.push(current);
      }

      expect(visited).toEqual([
        MoSCoWPriority.WONT_HAVE,
        MoSCoWPriority.COULD_HAVE,
        MoSCoWPriority.SHOULD_HAVE,
        MoSCoWPriority.MUST_HAVE,
      ]);

      expect(getPreviousMoscowPriority(current)).toBe(MoSCoWPriority.WONT_HAVE);
    });
  });
});
