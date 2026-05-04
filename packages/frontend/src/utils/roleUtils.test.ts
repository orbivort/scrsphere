import { describe, it, expect } from 'vitest';

import { getRoleLabel, getRoleBadgeClass, getRoleBadgeColor, canStartSprint } from './roleUtils';

describe('roleUtils', () => {
  describe('getRoleLabel', () => {
    it('should return "No Role" for null', () => {
      expect(getRoleLabel(null)).toBe('No Role');
    });

    it('should return "No Role" for empty string', () => {
      expect(getRoleLabel('')).toBe('No Role');
    });

    it('should return "Product Owner" for PRODUCT_OWNER', () => {
      expect(getRoleLabel('PRODUCT_OWNER')).toBe('Product Owner');
    });

    it('should return "Scrum Master" for SCRUM_MASTER', () => {
      expect(getRoleLabel('SCRUM_MASTER')).toBe('Scrum Master');
    });

    it('should return "Developer" for DEVELOPER', () => {
      expect(getRoleLabel('DEVELOPER')).toBe('Developer');
    });

    it('should return the role itself for unknown roles', () => {
      expect(getRoleLabel('UNKNOWN_ROLE')).toBe('UNKNOWN_ROLE');
    });

    it('should handle lowercase roles', () => {
      expect(getRoleLabel('product_owner')).toBe('product_owner');
    });
  });

  describe('getRoleBadgeClass', () => {
    const mockStyles = {
      'badge-default': 'default-class',
      'badge-po': 'po-class',
      'badge-sm': 'sm-class',
      'badge-dev': 'dev-class',
    };

    it('should return default class for null', () => {
      expect(getRoleBadgeClass(null, mockStyles)).toBe('default-class');
    });

    it('should return default class for empty string', () => {
      expect(getRoleBadgeClass('', mockStyles)).toBe('default-class');
    });

    it('should return po class for PRODUCT_OWNER', () => {
      expect(getRoleBadgeClass('PRODUCT_OWNER', mockStyles)).toBe('po-class');
    });

    it('should return sm class for SCRUM_MASTER', () => {
      expect(getRoleBadgeClass('SCRUM_MASTER', mockStyles)).toBe('sm-class');
    });

    it('should return dev class for DEVELOPER', () => {
      expect(getRoleBadgeClass('DEVELOPER', mockStyles)).toBe('dev-class');
    });

    it('should return default class for unknown roles', () => {
      expect(getRoleBadgeClass('UNKNOWN', mockStyles)).toBe('default-class');
    });

    it('should handle missing styles gracefully', () => {
      const emptyStyles: Record<string, string> = {};
      expect(getRoleBadgeClass('PRODUCT_OWNER', emptyStyles)).toBe('');
      expect(getRoleBadgeClass(null, emptyStyles)).toBe('');
    });

    it('should handle partial styles', () => {
      const partialStyles = { 'badge-po': 'po-class' };
      expect(getRoleBadgeClass('PRODUCT_OWNER', partialStyles)).toBe('po-class');
      expect(getRoleBadgeClass('DEVELOPER', partialStyles)).toBe('');
    });
  });

  describe('getRoleBadgeColor', () => {
    it('should return gray for null', () => {
      expect(getRoleBadgeColor(null)).toBe('#6b7280');
    });

    it('should return gray for empty string', () => {
      expect(getRoleBadgeColor('')).toBe('#6b7280');
    });

    it('should return amber for PRODUCT_OWNER', () => {
      expect(getRoleBadgeColor('PRODUCT_OWNER')).toBe('#f59e0b');
    });

    it('should return blue for SCRUM_MASTER', () => {
      expect(getRoleBadgeColor('SCRUM_MASTER')).toBe('#3b82f6');
    });

    it('should return green for DEVELOPER', () => {
      expect(getRoleBadgeColor('DEVELOPER')).toBe('#10b981');
    });

    it('should return gray for unknown roles', () => {
      expect(getRoleBadgeColor('UNKNOWN')).toBe('#6b7280');
    });
  });

  describe('canStartSprint', () => {
    it('should return false for null', () => {
      expect(canStartSprint(null)).toBe(false);
    });

    it('should return false for empty string', () => {
      expect(canStartSprint('')).toBe(false);
    });

    it('should return true for PRODUCT_OWNER', () => {
      expect(canStartSprint('PRODUCT_OWNER')).toBe(true);
    });

    it('should return true for SCRUM_MASTER', () => {
      expect(canStartSprint('SCRUM_MASTER')).toBe(true);
    });

    it('should return true for lowercase product_owner', () => {
      expect(canStartSprint('product_owner')).toBe(true);
    });

    it('should return true for lowercase scrum_master', () => {
      expect(canStartSprint('scrum_master')).toBe(true);
    });

    it('should return false for DEVELOPER', () => {
      expect(canStartSprint('DEVELOPER')).toBe(false);
    });

    it('should return false for unknown roles', () => {
      expect(canStartSprint('UNKNOWN')).toBe(false);
    });
  });
});
