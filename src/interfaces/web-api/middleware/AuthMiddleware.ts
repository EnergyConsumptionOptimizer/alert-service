import { type NextFunction, type Request, type Response } from "express";
import axios from "axios";

export class InvalidTokenError extends Error {
  constructor() {
    super("Access token is required");
  }
}
export interface AuthenticatedRequest extends Request {
  user?: {
    _id: string;
    role: string;
  };
}

export class AuthMiddleware {
  private readonly USER_SERVICE_URI =
    process.env.USER_SERVICE_URI ||
    `http://${process.env.USER_SERVICE_HOST || "user"}:${process.env.USER_SERVICE_PORT || 3000}`;

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
      const response = await axios.get(this.USER_SERVICE_URI + `${endpoint}`, {
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

  authenticateAdmin = async (
    request: Request,
    _res: Response,
    next: NextFunction,
  ): Promise<void> => {
    await this.verifyToken("/api/internal/auth/verify-admin", request, next);
  };
}
