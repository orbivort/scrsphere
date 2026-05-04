import { renderHook, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';

import { useRequireTeam, useTeamRole } from './useTeamContext';
import { useTeamContext } from '../contexts/TeamContext';

vi.mock('../contexts/TeamContext', () => ({
  useTeamContext: vi.fn(),
}));

vi.mock('react-router-dom', () => ({
  useNavigate: () => vi.fn(),
}));

const mockTeam = {
  id: 'team-1',
  name: 'Test Team',
  description: 'Test Team description',
  createdAt: '2024-01-01T00:00:00Z',
  updatedAt: '2024-01-01T00:00:00Z',
  createdBy: 'user-1',
};

describe('useRequireTeam', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    vi.mocked(useTeamContext).mockReturnValue({
      currentTeam: null,
      userRole: null,
      userTeams: [],
      setCurrentTeam: vi.fn(),
      refreshTeams: vi.fn(),
    } as any);
  });

  it('should return current team when available', async () => {
    vi.mocked(useTeamContext).mockReturnValue({
      currentTeam: mockTeam,
      userRole: 'MEMBER',
      userTeams: [mockTeam],
      setCurrentTeam: vi.fn(),
      refreshTeams: vi.fn(),
    } as any);

    const { result } = renderHook(() => useRequireTeam());

    await waitFor(() => {
      expect(result.current.currentTeam).toEqual(mockTeam);
    });
  });

  it('should return hasAccess true when no role requirements', async () => {
    vi.mocked(useTeamContext).mockReturnValue({
      currentTeam: mockTeam,
      userRole: 'MEMBER',
      userTeams: [mockTeam],
      setCurrentTeam: vi.fn(),
      refreshTeams: vi.fn(),
    } as any);

    const { result } = renderHook(() => useRequireTeam());

    await waitFor(() => {
      expect(result.current.hasAccess).toBe(true);
      expect(result.current.error).toBeNull();
    });
  });

  it('should return hasAccess false when user lacks required role', async () => {
    vi.mocked(useTeamContext).mockReturnValue({
      currentTeam: mockTeam,
      userRole: 'MEMBER',
      userTeams: [mockTeam],
      setCurrentTeam: vi.fn(),
      refreshTeams: vi.fn(),
    } as any);

    const { result } = renderHook(() =>
      useRequireTeam({ requireRoles: ['PRODUCT_OWNER', 'SCRUM_MASTER'] })
    );

    await waitFor(() => {
      expect(result.current.hasAccess).toBe(false);
      expect(result.current.error).toContain('Insufficient permissions');
    });
  });

  it('should return hasAccess true when user has required role', async () => {
    vi.mocked(useTeamContext).mockReturnValue({
      currentTeam: mockTeam,
      userRole: 'PRODUCT_OWNER',
      userTeams: [mockTeam],
      setCurrentTeam: vi.fn(),
      refreshTeams: vi.fn(),
    } as any);

    const { result } = renderHook(() =>
      useRequireTeam({ requireRoles: ['PRODUCT_OWNER', 'SCRUM_MASTER'] })
    );

    await waitFor(() => {
      expect(result.current.hasAccess).toBe(true);
      expect(result.current.error).toBeNull();
    });
  });

  it('should not require team when requireTeam is false', async () => {
    vi.mocked(useTeamContext).mockReturnValue({
      currentTeam: null,
      userRole: null,
      userTeams: [],
      setCurrentTeam: vi.fn(),
      refreshTeams: vi.fn(),
    } as any);

    const { result } = renderHook(() => useRequireTeam({ requireTeam: false }));

    await waitFor(() => {
      expect(result.current.currentTeam).toBeNull();
      expect(result.current.hasAccess).toBe(true);
    });
  });
});

describe('useTeamRole', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return hasRequiredRole true when user has role', () => {
    vi.mocked(useTeamContext).mockReturnValue({
      currentTeam: mockTeam,
      userRole: 'PRODUCT_OWNER',
      userTeams: [mockTeam],
      setCurrentTeam: vi.fn(),
      refreshTeams: vi.fn(),
    } as any);

    const { result } = renderHook(() => useTeamRole(['PRODUCT_OWNER', 'SCRUM_MASTER']));

    expect(result.current.hasRequiredRole).toBe(true);
    expect(result.current.canAccess).toBe(true);
    expect(result.current.userRole).toBe('PRODUCT_OWNER');
  });

  it('should return hasRequiredRole false when user lacks role', () => {
    vi.mocked(useTeamContext).mockReturnValue({
      currentTeam: mockTeam,
      userRole: 'MEMBER',
      userTeams: [mockTeam],
      setCurrentTeam: vi.fn(),
      refreshTeams: vi.fn(),
    } as any);

    const { result } = renderHook(() => useTeamRole(['PRODUCT_OWNER', 'SCRUM_MASTER']));

    expect(result.current.hasRequiredRole).toBe(false);
    expect(result.current.canAccess).toBe(false);
    expect(result.current.userRole).toBe('MEMBER');
  });

  it('should return hasRequiredRole false when userRole is null', () => {
    vi.mocked(useTeamContext).mockReturnValue({
      currentTeam: mockTeam,
      userRole: null,
      userTeams: [mockTeam],
      setCurrentTeam: vi.fn(),
      refreshTeams: vi.fn(),
    } as any);

    const { result } = renderHook(() => useTeamRole(['PRODUCT_OWNER']));

    expect(result.current.hasRequiredRole).toBe(false);
    expect(result.current.canAccess).toBe(false);
    expect(result.current.userRole).toBeNull();
  });
});
