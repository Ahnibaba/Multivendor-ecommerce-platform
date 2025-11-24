declare global {
  namespace Express {
    interface Request {
      user?: any;
      seller?: any;
      role?: string;
    }
  }
}

export {};
