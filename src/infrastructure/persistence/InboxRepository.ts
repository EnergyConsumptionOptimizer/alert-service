export interface InboxRepository {
	tryAcquire(eventId: string): Promise<boolean>;
}
