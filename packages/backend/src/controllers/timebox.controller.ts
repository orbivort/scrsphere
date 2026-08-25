// Timebox Controller
import { type Request, type Response } from 'express';
import { timeboxService } from '../services/timebox.service';
import { asyncHandler, createSuccessResponse } from '../utils/errors';
import { getParamValue } from '../utils/validation';
import { type ScrumEvent } from '@scrumooth/shared';

interface TimeboxKeyInput {
  eventType: ScrumEvent;
  sprintId?: string | null;
  date?: string;
}

/**
 * Build the timebox lookup key from validated input (query for GET, body for
 * control mutations) and the current team context attached by
 * `requireTeamContext`.
 */
const buildKey = (req: Request, input: TimeboxKeyInput) => ({
  teamId: req.currentTeamId as string,
  eventType: input.eventType,
  sprintId: input.sprintId ?? null,
  date: input.date ?? new Date().toISOString(),
});

export const getTimebox = asyncHandler(async (req: Request, res: Response) => {
  const eventType = getParamValue(req.params.eventType) as ScrumEvent;
  const query = req.validatedQuery ?? {};
  const state = await timeboxService.getTimebox(
    buildKey(req, {
      eventType,
      sprintId: (query.sprintId as string | undefined) ?? null,
      date: query.date as string | undefined,
    })
  );
  res.json(createSuccessResponse(state));
});

export const startTimebox = asyncHandler(async (req: Request, res: Response) => {
  const eventType = getParamValue(req.params.eventType) as ScrumEvent;
  const body = (req.validatedBody ?? {}) as TimeboxKeyInput;
  const state = await timeboxService.start(
    buildKey(req, { eventType, sprintId: body.sprintId, date: body.date }),
    req.userId as string
  );
  res.json(createSuccessResponse(state));
});

export const pauseTimebox = asyncHandler(async (req: Request, res: Response) => {
  const eventType = getParamValue(req.params.eventType) as ScrumEvent;
  const body = (req.validatedBody ?? {}) as TimeboxKeyInput;
  const state = await timeboxService.pause(
    buildKey(req, { eventType, sprintId: body.sprintId, date: body.date }),
    req.userId as string
  );
  res.json(createSuccessResponse(state));
});

export const resetTimebox = asyncHandler(async (req: Request, res: Response) => {
  const eventType = getParamValue(req.params.eventType) as ScrumEvent;
  const body = (req.validatedBody ?? {}) as TimeboxKeyInput;
  const state = await timeboxService.reset(
    buildKey(req, { eventType, sprintId: body.sprintId, date: body.date }),
    req.userId as string
  );
  res.json(createSuccessResponse(state));
});

export const concludeTimebox = asyncHandler(async (req: Request, res: Response) => {
  const eventType = getParamValue(req.params.eventType) as ScrumEvent;
  const body = (req.validatedBody ?? {}) as TimeboxKeyInput;
  const state = await timeboxService.conclude(
    buildKey(req, { eventType, sprintId: body.sprintId, date: body.date }),
    req.userId as string
  );
  res.json(createSuccessResponse(state));
});
