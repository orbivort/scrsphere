import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';

const mockNavigate = vi.fn();

vi.mock('react-router-dom', () => ({
  useNavigate: () => mockNavigate,
}));

const mockUseTeamContext = vi.fn();

vi.mock('../contexts/TeamContext', () => ({
  useTeamContext: () => mockUseTeamContext(),
}));

import { useRequireTeam, useTeamRole } from './useTeamContext';

describe('useRequireTeam', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseTeamContext.mockReturnValue({
      currentTeam: { id: 'team-1', name: 'Team 1' },
      userRole: 'SCRUM_MASTER',
      userTeams: [{ id: 'team-1', name: 'Team 1' }],
    });
  });

  it('should return currentTeam when team is available', () => {
    const { result } = renderHook(() => useRequireTeam());

    expect(result.current.currentTeam).toBeDefined();
    expect(result.current.hasAccess).toBe(true);
    expect(result.current.error).toBeNull();
  });

  it('should navigate to /team when requireTeam is true and no current team with no teams', () => {
    mockUseTeamContext.mockReturnValue({
      currentTeam: null,
      userRole: null,
      userTeams: [],
    });

    renderHook(() => useRequireTeam());

    expect(mockNavigate).toHaveBeenCalledWith('/team');
  });

  it('should not navigate when requireTeam is true and no current team with single team', () => {
    mockUseTeamContext.mockReturnValue({
      currentTeam: null,
      userRole: null,
      userTeams: [{ id: 'team-1', name: 'Team 1' }],
    });

    renderHook(() => useRequireTeam());

    expect(mockNavigate).not.toHaveBeenCalled();
  });

  it('should not navigate when requireTeam is false', () => {
    mockUseTeamContext.mockReturnValue({
      currentTeam: null,
      userRole: null,
      userTeams: [],
    });

    renderHook(() => useRequireTeam({ requireTeam: false }));

    expect(mockNavigate).not.toHaveBeenCalled();
  });

  it('should set error when user lacks required roles', () => {
    const { result } = renderHook(() => useRequireTeam({ requireRoles: ['ADMIN'] }));

    expect(result.current.error).toBe('Insufficient permissions. Required roles: ADMIN');
    expect(result.current.hasAccess).toBe(false);
  });

  it('should not set error when user has required roles', () => {
    const { result } = renderHook(() => useRequireTeam({ requireRoles: ['SCRUM_MASTER'] }));

    expect(result.current.error).toBeNull();
    expect(result.current.hasAccess).toBe(true);
  });

  it('should use custom redirect path', () => {
    mockUseTeamContext.mockReturnValue({
      currentTeam: null,
      userRole: null,
      userTeams: [],
    });

    renderHook(() => useRequireTeam({ redirectTo: '/custom-path' }));

    expect(mockNavigate).toHaveBeenCalledWith('/custom-path');
  });

  it('should handle undefined userRole when checking permissions', () => {
    mockUseTeamContext.mockReturnValue({
      currentTeam: { id: 'team-1', name: 'Team 1' },
      userRole: null,
      userTeams: [{ id: 'team-1', name: 'Team 1' }],
    });

    const { result } = renderHook(() => useRequireTeam({ requireRoles: ['ADMIN'] }));

    expect(result.current.error).toBeNull();
    expect(result.current.hasAccess).toBe(true);
  });
});

describe('useTeamRole', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return true when user has required role', () => {
    mockUseTeamContext.mockReturnValue({
      userRole: 'ADMIN',
    });

    const { result } = renderHook(() => useTeamRole(['ADMIN']));

    expect(result.current.hasRequiredRole).toBe(true);
    expect(result.current.canAccess).toBe(true);
  });

  it('should return false when user does not have required role', () => {
    mockUseTeamContext.mockReturnValue({
      userRole: 'MEMBER',
    });

    const { result } = renderHook(() => useTeamRole(['ADMIN']));

    expect(result.current.hasRequiredRole).toBe(false);
    expect(result.current.canAccess).toBe(false);
  });

  it('should return false when userRole is null', () => {
    mockUseTeamContext.mockReturnValue({
      userRole: null,
    });

    const { result } = renderHook(() => useTeamRole(['ADMIN']));

    expect(result.current.hasRequiredRole).toBe(false);
    expect(result.current.canAccess).toBe(false);
  });

  it('should return userRole', () => {
    mockUseTeamContext.mockReturnValue({
      userRole: 'SCRUM_MASTER',
    });

    const { result } = renderHook(() => useTeamRole(['ADMIN', 'SCRUM_MASTER']));

    expect(result.current.userRole).toBe('SCRUM_MASTER');
  });
});
