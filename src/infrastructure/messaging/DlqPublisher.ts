export interface DlqPublisher {
	publish(raw: string, reason: unknown): Promise<void>;
}
