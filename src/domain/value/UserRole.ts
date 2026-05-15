export const UserRoles = {
	ADMIN: "ADMIN",
	HOUSEHOLD: "HOUSEHOLD",
} as const;

export type UserRole = (typeof UserRoles)[keyof typeof UserRoles];
