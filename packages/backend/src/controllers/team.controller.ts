// Team Controller
import { type Request, type Response } from 'express';
import { teamService } from '../services/team.service';
import { asyncHandler, createSuccessResponse, UnauthorizedError } from '../utils/errors';
import { getParamValue } from '../utils/validation';

/**
 * Get all teams for current user
 */
export const getUserTeams = asyncHandler(async (req: Request, res: Response) => {
  const { page, limit, search, sortBy, sortOrder } = req.query;
  const userId = req.userId;
  if (!userId) {
    throw new UnauthorizedError('User not authenticated');
  }
  const result = await teamService.getUserTeams(userId, {
    page: page ? parseInt(page as string) : undefined,
    limit: limit ? parseInt(limit as string) : undefined,
    search: search as string,
    sortBy: sortBy as string,
    sortOrder: sortOrder as 'asc' | 'desc',
  });
  res.json(createSuccessResponse(result));
});

/**
 * Get team by ID
 */
export const getTeamById = asyncHandler(async (req: Request, res: Response) => {
  const teamId = getParamValue(req.params.teamId);
  if (!teamId) {
    throw new Error('Team ID is required');
  }
  const userId = req.userId;
  if (!userId) {
    throw new UnauthorizedError('User not authenticated');
  }
  const team = await teamService.getTeamById(teamId, userId);
  res.json(createSuccessResponse(team));
});

/**
 * Create a new team
 */
export const createTeam = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.userId;
  if (!userId) {
    throw new UnauthorizedError('User not authenticated');
  }
  const team = await teamService.createTeam(userId, req.body);
  res.status(201).json(createSuccessResponse(team));
});

/**
 * Update team
 */
export const updateTeam = asyncHandler(async (req: Request, res: Response) => {
  const teamId = getParamValue(req.params.teamId);
  if (!teamId) {
    throw new Error('Team ID is required');
  }
  const userId = req.userId;
  if (!userId) {
    throw new UnauthorizedError('User not authenticated');
  }
  const team = await teamService.updateTeam(teamId, userId, req.body);
  res.json(createSuccessResponse(team));
});

/**
 * Delete team
 */
export const deleteTeam = asyncHandler(async (req: Request, res: Response) => {
  const teamId = getParamValue(req.params.teamId);
  if (!teamId) {
    throw new Error('Team ID is required');
  }
  const userId = req.userId;
  if (!userId) {
    throw new UnauthorizedError('User not authenticated');
  }
  await teamService.deleteTeam(teamId, userId);
  res.json(createSuccessResponse({ message: 'Team deleted successfully' }));
});

/**
 * Add member to team
 */
export const addMember = asyncHandler(async (req: Request, res: Response) => {
  const teamId = getParamValue(req.params.teamId);
  if (!teamId) {
    throw new Error('Team ID is required');
  }
  const userId = req.userId;
  if (!userId) {
    throw new UnauthorizedError('User not authenticated');
  }
  const member = await teamService.addMember(teamId, userId, req.body);
  res.status(201).json(createSuccessResponse(member));
});

/**
 * Remove member from team
 */
export const removeMember = asyncHandler(async (req: Request, res: Response) => {
  const teamId = getParamValue(req.params.teamId);
  const memberId = getParamValue(req.params.memberId);
  if (!teamId || !memberId) {
    throw new Error('Team ID and Member ID are required');
  }
  const userId = req.userId;
  if (!userId) {
    throw new UnauthorizedError('User not authenticated');
  }
  await teamService.removeMember(teamId, userId, memberId);
  res.json(createSuccessResponse({ message: 'Member removed successfully' }));
});

/**
 * Update member role
 */
export const updateMemberRole = asyncHandler(async (req: Request, res: Response) => {
  const teamId = getParamValue(req.params.teamId);
  const memberId = getParamValue(req.params.memberId);
  if (!teamId || !memberId) {
    throw new Error('Team ID and Member ID are required');
  }
  const { role } = req.body;
  const userId = req.userId;
  if (!userId) {
    throw new UnauthorizedError('User not authenticated');
  }
  const member = await teamService.updateMemberRole(teamId, userId, memberId, role);
  res.json(createSuccessResponse(member));
});

/**
 * Get current user's teams with roles
 */
export const getMyTeams = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.userId;
  if (!userId) {
    throw new UnauthorizedError('User not authenticated');
  }
  const teams = await teamService.getUserTeamsWithRoles(userId);
  res.json(createSuccessResponse(teams));
});

/**
 * Get user's role in a specific team
 */
export const getMyRoleInTeam = asyncHandler(async (req: Request, res: Response) => {
  const teamId = getParamValue(req.params.teamId);
  if (!teamId) {
    throw new Error('Team ID is required');
  }
  const userId = req.userId;
  if (!userId) {
    throw new UnauthorizedError('User not authenticated');
  }
  const role = await teamService.getUserRoleInTeam(userId, teamId);

  if (!role) {
    res.status(404).json({
      success: false,
      error: { message: 'User is not a member of this team' },
    });
    return;
  }

  res.json(createSuccessResponse({ role }));
});

/**
 * Select team (for session management)
 */
export const selectTeam = asyncHandler(async (req: Request, res: Response) => {
  const { teamId } = req.body;

  if (!teamId) {
    res.status(400).json({
      success: false,
      error: { message: 'Team ID is required' },
    });
    return;
  }

  const userId = req.userId;
  if (!userId) {
    res.status(401).json({
      success: false,
      error: { message: 'User not authenticated' },
    });
    return;
  }

  const isValid = await teamService.validateTeamMembership(userId, teamId);

  if (!isValid) {
    res.status(403).json({
      success: false,
      error: { message: 'You are not a member of this team' },
    });
    return;
  }

  const teams = await teamService.getUserTeamsWithRoles(userId);
  const team = teams.find((t) => t.id === teamId);

  if (!team) {
    res.status(404).json({
      success: false,
      error: { message: 'Team not found' },
    });
    return;
  }

  res.json(createSuccessResponse(team));
});
