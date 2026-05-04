// Validation Middleware using Zod
import { type Request, type Response, type NextFunction } from 'express';
import { type ZodSchema, ZodError } from 'zod';
import { ValidationError } from '../utils/errors';
import { logger } from '../utils/logger';

// Extend Express Request to include validated data
declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      validatedBody?: unknown;
      validatedParams?: Record<string, string>;
      validatedQuery?: Record<string, string>;
    }
  }
}

/**
 * Validate request body against Zod schema
 */
export const validateBody = (schema: ZodSchema) => {
  return async (req: Request, _res: Response, next: NextFunction): Promise<void> => {
    try {
      logger.debug('Validating request body', {
        path: req.path,
        method: req.method,
      });
      // Store validated data in a separate property instead of overwriting req.body
      req.validatedBody = await schema.parseAsync(req.body);
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const details = error.issues.map((err) => ({
          field: err.path.join('.'),
          message: err.message,
        }));
        logger.warn('Body validation failed', {
          path: req.path,
          method: req.method,
          errors: details,
        });
        next(new ValidationError(details));
      } else {
        next(error);
      }
    }
  };
};

/**
 * Validate request params against Zod schema
 */
export const validateParams = (schema: ZodSchema) => {
  return async (req: Request, _res: Response, next: NextFunction): Promise<void> => {
    try {
      // Store validated data in a separate property instead of overwriting req.params
      req.validatedParams = (await schema.parseAsync(req.params)) as Record<string, string>;
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const details = error.issues.map((err) => ({
          field: err.path.join('.'),
          message: err.message,
        }));
        next(new ValidationError(details));
      } else {
        next(error);
      }
    }
  };
};

/**
 * Validate request query against Zod schema
 */
export const validateQuery = (schema: ZodSchema) => {
  return async (req: Request, _res: Response, next: NextFunction): Promise<void> => {
    try {
      // Store validated data in a separate property instead of overwriting req.query
      req.validatedQuery = (await schema.parseAsync(req.query)) as Record<string, string>;
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const details = error.issues.map((err) => ({
          field: err.path.join('.'),
          message: err.message,
        }));
        next(new ValidationError(details));
      } else {
        next(error);
      }
    }
  };
};

export default { validateBody, validateParams, validateQuery };
