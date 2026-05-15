import { z } from "zod";

export const NotificationIdParamSchema = z.object({
	params: z.object({ id: z.string().nonempty() }),
});
