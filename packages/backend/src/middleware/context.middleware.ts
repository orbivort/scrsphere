// Context Middleware for Request Context Propagation
import { type Request, type Response, type NextFunction } from 'express';
import { setRequestContext, type RequestContext } from '../utils/requestContext';

/**
 * Middleware that initializes request context in AsyncLocalStorage.
 *
 * This middleware should be placed after the requestId middleware.
 * The context is initialized with requestId and can be updated later
 * by auth middleware (userId) and teamContext middleware (teamId).
 */
export const contextMiddleware = (req: Request, _res: Response, next: NextFunction): void => {
  const context: RequestContext = {
    requestId: req.id ?? '',
  };

  setRequestContext(context, () => {
    next();
  });
};

export default contextMiddleware;
