import { type UserRole, UserRoles } from "@domain/value/UserRole";
import { AuthRequiredError, ForbiddenError } from "@presentation/errors";
import type { NextFunction, Request, Response } from "express";

export interface AuthenticatedUser {
	readonly id: string;
	readonly username: string;
	readonly role: UserRole;
}

export interface AppLocals {
	user: AuthenticatedUser;
}

export function forwardAuth(
	req: Request,
	res: Response<unknown, AppLocals>,
	next: NextFunction,
): void {
	const userId = req.headers["x-user-id"];
	const userRole = req.headers["x-user-role"];
	const username = req.headers["x-user-username"];

	if (typeof userId !== "string") {
		throw new AuthRequiredError();
	}

	res.locals.user = {
		id: userId,
		username: typeof username === "string" ? username : "",
		role: (userRole as UserRole) || UserRoles.HOUSEHOLD,
	};

	next();
}

export function requireRole(...roles: UserRole[]) {
	return (
		_req: Request,
		res: Response<unknown, AppLocals>,
		next: NextFunction,
	): void => {
		const { user } = res.locals;
		if (!user || !roles.includes(user.role)) {
			throw new ForbiddenError();
		}
		next();
	};
}
