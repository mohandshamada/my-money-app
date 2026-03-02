import { Request } from 'express';

// Extend Express Request so auth middleware and route handlers agree on req.user type
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        email: string;
      };
    }
  }
}

export interface AuthRequest extends Request {
  user?: {
    id: string;
    email: string;
  };
}
