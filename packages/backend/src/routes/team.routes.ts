// Team Routes
import { Router, type Router as RouterType } from 'express';
import * as teamController from '../controllers/team.controller';
import * as dodController from '../controllers/dod.controller';
import * as dorController from '../controllers/dor.controller';
import { authenticate } from '../middleware/auth.middleware';
import { validateBody, validateParams } from '../middleware/validation.middleware';
import { z } from 'zod';

const router: RouterType = Router();

// All routes require authentication
router.use(authenticate);

// Validation schemas
const createTeamSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100),
  description: z.string().max(500).optional(),
});

const addMemberSchema = z.object({
  email: z.string().email('Invalid email'),
  role: z.enum(['ADMINISTRATOR', 'PRODUCT_OWNER', 'SCRUM_MASTER', 'DEVELOPER']),
});

const updateMemberSchema = z.object({
  role: z.enum(['ADMINISTRATOR', 'PRODUCT_OWNER', 'SCRUM_MASTER', 'DEVELOPER']),
});

const teamIdSchema = z.object({
  teamId: z.string().uuid('Invalid team ID'),
});

const memberIdSchema = z.object({
  teamId: z.string().uuid('Invalid team ID'),
  memberId: z.string().uuid('Invalid member ID'),
});

const updateDoDSchema = z.object({
  items: z.array(
    z.object({
      id: z.string().optional(),
      description: z.string().min(1, 'Description is required'),
      category: z.string().optional(),
      isActive: z.boolean(),
      order: z.number(),
    })
  ),
});

const updateDoRSchema = z.object({
  items: z.array(
    z.object({
      id: z.string().optional(),
      description: z.string().min(1, 'Description is required'),
      category: z.string().optional(),
      isActive: z.boolean(),
      order: z.number(),
    })
  ),
});

/**
 * @route   GET /api/v1/teams
 * @desc    Get all teams for current user
 * @access  Private
 */
router.get('/', teamController.getUserTeams);

/**
 * @route   GET /api/v1/teams/my-teams
 * @desc    Get current user's teams with roles
 * @access  Private
 */
router.get('/my-teams', teamController.getMyTeams);

/**
 * @route   POST /api/v1/teams
 * @desc    Create a new team
 * @access  Private
 */
router.post('/', validateBody(createTeamSchema), teamController.createTeam);

/**
 * @route   GET /api/v1/teams/:teamId
 * @desc    Get team by ID
 * @access  Private
 */
router.get('/:teamId', validateParams(teamIdSchema), teamController.getTeamById);

/**
 * @route   PUT /api/v1/teams/:teamId
 * @desc    Update team
 * @access  Private (Administrator)
 */
router.put(
  '/:teamId',
  validateParams(teamIdSchema),
  validateBody(createTeamSchema.partial()),
  teamController.updateTeam
);

/**
 * @route   DELETE /api/v1/teams/:teamId
 * @desc    Delete team
 * @access  Private (Administrator)
 */
router.delete('/:teamId', validateParams(teamIdSchema), teamController.deleteTeam);

/**
 * @route   POST /api/v1/teams/:teamId/members
 * @desc    Add member to team
 * @access  Private (Scrum Master)
 */
router.post(
  '/:teamId/members',
  validateParams(teamIdSchema),
  validateBody(addMemberSchema),
  teamController.addMember
);

/**
 * @route   DELETE /api/v1/teams/:teamId/members/:memberId
 * @desc    Remove member from team
 * @access  Private (Scrum Master)
 */
router.delete(
  '/:teamId/members/:memberId',
  validateParams(memberIdSchema),
  teamController.removeMember
);

/**
 * @route   PUT /api/v1/teams/:teamId/members/:memberId
 * @desc    Update member role
 * @access  Private (Scrum Master)
 */
router.put(
  '/:teamId/members/:memberId',
  validateParams(memberIdSchema),
  validateBody(updateMemberSchema),
  teamController.updateMemberRole
);

/**
 * @route   GET /api/v1/teams/:teamId/my-role
 * @desc    Get user's role in a specific team
 * @access  Private
 */
router.get('/:teamId/my-role', validateParams(teamIdSchema), teamController.getMyRoleInTeam);

/**
 * @route   POST /api/v1/teams/select-team
 * @desc    Select team (for session management)
 * @access  Private
 */
router.post('/select-team', teamController.selectTeam);

/**
 * @route   GET /api/v1/teams/:teamId/definition-of-done
 * @desc    Get Definition of Done for a team
 * @access  Private
 */
router.get(
  '/:teamId/definition-of-done',
  validateParams(teamIdSchema),
  dodController.getDefinitionOfDone
);

/**
 * @route   PUT /api/v1/teams/:teamId/definition-of-done
 * @desc    Update Definition of Done for a team
 * @access  Private (Scrum Master)
 */
router.put(
  '/:teamId/definition-of-done',
  validateParams(teamIdSchema),
  validateBody(updateDoDSchema),
  dodController.updateDefinitionOfDone
);

/**
 * @route   GET /api/v1/teams/:teamId/definition-of-done/history
 * @desc    Get Definition of Done history for a team
 * @access  Private
 */
router.get(
  '/:teamId/definition-of-done/history',
  validateParams(teamIdSchema),
  dodController.getDoDHistory
);

/**
 * @route   GET /api/v1/teams/:teamId/definition-of-ready
 * @desc    Get Definition of Ready for a team
 * @access  Private
 */
router.get(
  '/:teamId/definition-of-ready',
  validateParams(teamIdSchema),
  dorController.getDefinitionOfReady
);

/**
 * @route   PUT /api/v1/teams/:teamId/definition-of-ready
 * @desc    Update Definition of Ready for a team
 * @access  Private (Scrum Master)
 */
router.put(
  '/:teamId/definition-of-ready',
  validateParams(teamIdSchema),
  validateBody(updateDoRSchema),
  dorController.updateDefinitionOfReady
);

/**
 * @route   GET /api/v1/teams/:teamId/definition-of-ready/history
 * @desc    Get Definition of Ready history for a team
 * @access  Private
 */
router.get(
  '/:teamId/definition-of-ready/history',
  validateParams(teamIdSchema),
  dorController.getDoRHistory
);

export default router;
