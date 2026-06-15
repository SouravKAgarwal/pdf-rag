import { getAuth } from "@clerk/express";
import type { NextFunction, Request, Response } from "express";

/**
 * Middleware that verifies Clerk authentication for API routes.
 * Uses getAuth() (not requireAuth) so we return a 401 JSON response
 * instead of redirecting to a sign-in page.
 */
export const verifyAuth = (req: Request, res: Response, next: NextFunction) => {
  const auth = getAuth(req);
  if (!auth?.userId) {
    res.status(401).json({ error: "Unauthorized: No valid session" });
    return;
  }
  next();
};

/**
 * Extract the authenticated userId from the request.
 * Must be called after clerkMiddleware() has run.
 */
export function getUserId(req: Request): string {
  const auth = getAuth(req);
  if (!auth?.userId) {
    throw new Error("Unauthorized: No user ID found in session");
  }
  return auth.userId;
}
