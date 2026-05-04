import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';

import { TeamMemberSelect } from './TeamMemberSelect';
import type { TeamMember, User } from '../../types';

vi.mock('./TeamMemberSelect.module.css', () => ({
  default: {
    'team-member-select': 'team-member-select',
  },
}));

const createMockUser = (overrides: Partial<User> = {}): User => ({
  id: 'user-1',
  email: 'test@example.com',
  firstName: 'John',
  lastName: 'Doe',
  createdAt: '2024-01-01T00:00:00Z',
  updatedAt: '2024-01-01T00:00:00Z',
  ...overrides,
});

const createMockTeamMember = (overrides: Partial<TeamMember> = {}): TeamMember => ({
  id: 'member-1',
  teamId: 'team-1',
  userId: 'user-1',
  role: 'developer',
  joinedAt: '2024-01-01T00:00:00Z',
  user: createMockUser(),
  ...overrides,
});

describe('TeamMemberSelect Component', () => {
  const mockOnChange = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Component Rendering Tests', () => {
    it('should render select element', () => {
      const teamMembers = [createMockTeamMember()];
      render(<TeamMemberSelect value="" onChange={mockOnChange} teamMembers={teamMembers} />);

      expect(screen.getByRole('combobox')).toBeInTheDocument();
    });

    it('should render default label', () => {
      const teamMembers = [createMockTeamMember()];
      render(<TeamMemberSelect value="" onChange={mockOnChange} teamMembers={teamMembers} />);

      expect(screen.getByText('Assign to')).toBeInTheDocument();
    });

    it('should render custom label', () => {
      const teamMembers = [createMockTeamMember()];
      render(
        <TeamMemberSelect
          value=""
          onChange={mockOnChange}
          teamMembers={teamMembers}
          label="Select Team Member"
        />
      );

      expect(screen.getByText('Select Team Member')).toBeInTheDocument();
    });

    it('should render Unassigned option', () => {
      const teamMembers = [createMockTeamMember()];
      render(<TeamMemberSelect value="" onChange={mockOnChange} teamMembers={teamMembers} />);

      expect(screen.getByText('Unassigned')).toBeInTheDocument();
    });

    it('should render team member options', () => {
      const teamMembers = [
        createMockTeamMember({
          id: 'member-1',
          userId: 'user-1',
          user: createMockUser({ id: 'user-1', firstName: 'John', lastName: 'Doe' }),
        }),
        createMockTeamMember({
          id: 'member-2',
          userId: 'user-2',
          user: createMockUser({ id: 'user-2', firstName: 'Jane', lastName: 'Smith' }),
        }),
      ];
      render(<TeamMemberSelect value="" onChange={mockOnChange} teamMembers={teamMembers} />);

      expect(screen.getByText('John Doe (Developer)')).toBeInTheDocument();
      expect(screen.getByText('Jane Smith (Developer)')).toBeInTheDocument();
    });
  });

  describe('Role Label Tests', () => {
    it('should display Product Owner role correctly', () => {
      const teamMembers = [createMockTeamMember({ role: 'product_owner' })];
      render(<TeamMemberSelect value="" onChange={mockOnChange} teamMembers={teamMembers} />);

      expect(screen.getByText('John Doe (Product Owner)')).toBeInTheDocument();
    });

    it('should display Scrum Master role correctly', () => {
      const teamMembers = [createMockTeamMember({ role: 'scrum_master' })];
      render(<TeamMemberSelect value="" onChange={mockOnChange} teamMembers={teamMembers} />);

      expect(screen.getByText('John Doe (Scrum Master)')).toBeInTheDocument();
    });

    it('should display Developer role correctly', () => {
      const teamMembers = [createMockTeamMember({ role: 'developer' })];
      render(<TeamMemberSelect value="" onChange={mockOnChange} teamMembers={teamMembers} />);

      expect(screen.getByText('John Doe (Developer)')).toBeInTheDocument();
    });

    it('should display unknown role as-is', () => {
      const teamMembers = [createMockTeamMember({ role: 'custom_role' as any })];
      render(<TeamMemberSelect value="" onChange={mockOnChange} teamMembers={teamMembers} />);

      expect(screen.getByText('John Doe (custom_role)')).toBeInTheDocument();
    });
  });

  describe('User Display Tests', () => {
    it('should display user with first and last name', () => {
      const teamMembers = [
        createMockTeamMember({
          user: createMockUser({ firstName: 'John', lastName: 'Doe' }),
        }),
      ];
      render(<TeamMemberSelect value="" onChange={mockOnChange} teamMembers={teamMembers} />);

      expect(screen.getByText('John Doe (Developer)')).toBeInTheDocument();
    });

    it('should display email when name is not available', () => {
      const teamMembers = [
        createMockTeamMember({
          user: createMockUser({ firstName: '', lastName: '', email: 'test@example.com' }),
        }),
      ];
      render(<TeamMemberSelect value="" onChange={mockOnChange} teamMembers={teamMembers} />);

      expect(screen.getByText('test@example.com (Developer)')).toBeInTheDocument();
    });

    it('should display Unknown User when no user data', () => {
      const teamMembers = [
        createMockTeamMember({
          user: undefined as any,
        }),
      ];
      render(<TeamMemberSelect value="" onChange={mockOnChange} teamMembers={teamMembers} />);

      expect(screen.getByText('Unknown User (Developer)')).toBeInTheDocument();
    });

    it('should display email when only first name is available', () => {
      const teamMembers = [
        createMockTeamMember({
          user: createMockUser({ firstName: 'John', lastName: '', email: 'john@example.com' }),
        }),
      ];
      render(<TeamMemberSelect value="" onChange={mockOnChange} teamMembers={teamMembers} />);

      expect(screen.getByText('john@example.com (Developer)')).toBeInTheDocument();
    });
  });

  describe('Value Selection Tests', () => {
    it('should have correct value selected', () => {
      const teamMembers = [
        createMockTeamMember({ userId: 'user-1' }),
        createMockTeamMember({
          id: 'member-2',
          userId: 'user-2',
          user: createMockUser({ id: 'user-2' }),
        }),
      ];
      render(<TeamMemberSelect value="user-2" onChange={mockOnChange} teamMembers={teamMembers} />);

      const select = screen.getByRole('combobox');
      expect(select).toHaveValue('user-2');
    });

    it('should have empty value when no selection', () => {
      const teamMembers = [createMockTeamMember()];
      render(<TeamMemberSelect value="" onChange={mockOnChange} teamMembers={teamMembers} />);

      const select = screen.getByRole('combobox');
      expect(select).toHaveValue('');
    });
  });

  describe('User Interaction Tests', () => {
    it('should call onChange when selection changes', () => {
      const teamMembers = [
        createMockTeamMember({ userId: 'user-1' }),
        createMockTeamMember({
          id: 'member-2',
          userId: 'user-2',
          user: createMockUser({ id: 'user-2' }),
        }),
      ];
      render(<TeamMemberSelect value="" onChange={mockOnChange} teamMembers={teamMembers} />);

      const select = screen.getByRole('combobox');
      fireEvent.change(select, { target: { value: 'user-2' } });

      expect(mockOnChange).toHaveBeenCalledWith('user-2');
    });

    it('should call onChange with empty string when Unassigned is selected', () => {
      const teamMembers = [createMockTeamMember()];
      render(<TeamMemberSelect value="user-1" onChange={mockOnChange} teamMembers={teamMembers} />);

      const select = screen.getByRole('combobox');
      fireEvent.change(select, { target: { value: '' } });

      expect(mockOnChange).toHaveBeenCalledWith('');
    });
  });

  describe('Disabled State Tests', () => {
    it('should not be disabled by default', () => {
      const teamMembers = [createMockTeamMember()];
      render(<TeamMemberSelect value="" onChange={mockOnChange} teamMembers={teamMembers} />);

      const select = screen.getByRole('combobox');
      expect(select).not.toBeDisabled();
    });

    it('should be disabled when disabled prop is true', () => {
      const teamMembers = [createMockTeamMember()];
      render(
        <TeamMemberSelect value="" onChange={mockOnChange} teamMembers={teamMembers} disabled />
      );

      const select = screen.getByRole('combobox');
      expect(select).toBeDisabled();
    });

    it('should not call onChange when disabled', () => {
      const teamMembers = [createMockTeamMember()];
      render(
        <TeamMemberSelect value="" onChange={mockOnChange} teamMembers={teamMembers} disabled />
      );

      const select = screen.getByRole('combobox');
      fireEvent.change(select, { target: { value: 'user-1' } });

      expect(mockOnChange).not.toHaveBeenCalled();
    });
  });

  describe('Accessibility Tests', () => {
    it('should have aria-label attribute', () => {
      const teamMembers = [createMockTeamMember()];
      render(
        <TeamMemberSelect
          value=""
          onChange={mockOnChange}
          teamMembers={teamMembers}
          label="Select Assignee"
        />
      );

      const select = screen.getByRole('combobox');
      expect(select).toHaveAttribute('aria-label', 'Select Assignee');
    });

    it('should have default aria-label', () => {
      const teamMembers = [createMockTeamMember()];
      render(<TeamMemberSelect value="" onChange={mockOnChange} teamMembers={teamMembers} />);

      const select = screen.getByRole('combobox');
      expect(select).toHaveAttribute('aria-label', 'Assign to');
    });
  });

  describe('Edge Case Tests', () => {
    it('should handle empty team members array', () => {
      render(<TeamMemberSelect value="" onChange={mockOnChange} teamMembers={[]} />);

      expect(screen.getByText('Unassigned')).toBeInTheDocument();
    });

    it('should handle team members with partial user data', () => {
      const teamMembers = [
        createMockTeamMember({
          user: { id: 'user-1', email: 'partial@example.com' } as any,
        }),
      ];
      render(<TeamMemberSelect value="" onChange={mockOnChange} teamMembers={teamMembers} />);

      expect(screen.getByText('partial@example.com (Developer)')).toBeInTheDocument();
    });

    it('should handle large number of team members', () => {
      const teamMembers = Array.from({ length: 20 }, (_, i) =>
        createMockTeamMember({
          id: `member-${i}`,
          userId: `user-${i}`,
          user: createMockUser({ id: `user-${i}`, firstName: `User${i}`, lastName: 'Test' }),
        })
      );
      render(<TeamMemberSelect value="" onChange={mockOnChange} teamMembers={teamMembers} />);

      teamMembers.forEach((member) => {
        expect(
          screen.getByText(`User${member.userId.split('-')[1]} Test (Developer)`)
        ).toBeInTheDocument();
      });
    });
  });
});
