import { type NextFunction, type Request, type Response } from "express";
import axios from "axios";

/**
 * Error thrown when the authentication token is missing or invalid.
 */
export class InvalidTokenError extends Error {
  constructor() {
    super("Access token is required");
  }
}

/**
 * Represents a request augmented with authenticated user information.
 */
export interface AuthenticatedRequest extends Request {
  user?: {
    _id: string;
    role: string;
  };
}

/**
 * Verifies and enforces authentication using an external user service.
 *
 * @param user_service_uri - The base URI of the user service used to verify tokens.
 */
export class AuthMiddleware {
  constructor(private readonly user_service_uri: string) {}

  private getAuthTokenFromCookies(request: Request): string {
    const token = request.cookies?.["authToken"];
    if (!token) {
      throw new InvalidTokenError();
    }
    return token;
  }

  private async verifyToken(
    endpoint: string,
    request: AuthenticatedRequest,
    next: NextFunction,
  ) {
    try {
      const token = this.getAuthTokenFromCookies(request);
      const response = await axios.get(this.user_service_uri + `${endpoint}`, {
        headers: {
          Cookie: `authToken=${token}`,
        },
        withCredentials: true,
      });
      if (response.data) {
        request.user = response.data;
      }

      next();
    } catch (error) {
      next(error);
    }
  }

  authenticate = async (
    request: Request,
    _res: Response,
    next: NextFunction,
  ): Promise<void> => {
    await this.verifyToken("/api/internal/auth/verify", request, next);
  };

  /**
   * Middleware that verifies an admin-level token and invokes `next`.
   *
   * @param request - The incoming request to authenticate.
   * @param _res - The response object (unused).
   * @param next - The next middleware function.
   */
  authenticateAdmin = async (
    request: Request,
    _res: Response,
    next: NextFunction,
  ): Promise<void> => {
    await this.verifyToken("/api/internal/auth/verify-admin", request, next);
  };
}
