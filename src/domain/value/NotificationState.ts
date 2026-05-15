export const NotificationStates = {
	PENDING: "PENDING",
	SENT: "SENT",
	FAILED: "FAILED",
} as const;

export type NotificationState =
	(typeof NotificationStates)[keyof typeof NotificationStates];
