import { Response, NextFunction } from "express";
import { AuthError } from "../error-handler";



export const isSeller = async (req: any, res: Response, next: NextFunction) => {
  if (req.role !== "seller") {
    return next(new AuthError("Access denied: Seller only"))
  }
  next()
}

export const isUser = async (req: any, res: Response, next: NextFunction) => {
  if (req.role !== "user") {
    return next(new AuthError("Access denied: user only"))
  }
  next()
}