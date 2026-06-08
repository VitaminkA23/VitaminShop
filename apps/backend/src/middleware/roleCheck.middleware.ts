import { Request, Response, NextFunction } from 'express';
import { Role } from '@vitamin/types';

export function roleCheckMiddleware(allowedRoles: Role[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ message: 'Unauthorized — no user on request' });
      return;
    }

    if (!allowedRoles.includes(req.user.role)) {
      res.status(403).json({ message: 'Forbidden — insufficient permissions' });
      return;
    }

    next();
  };
}