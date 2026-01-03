import { Alert } from "@domain/Alert";
import { AlertId } from "@domain/value/AlertId";
import { BreachDetails } from "@domain/value/BreachDetails";
import { AlertStatus } from "@domain/value/AlertStatus";

export const AlertFactory = {
  createPending: (id: string) => {
    return {
      id: AlertId.of(id),
      status: AlertStatus.PENDING,
      createdAt: new Date(),
      sentAt: null,
      failReason: null,
      details: new BreachDetails(
        "t-1",
        "High electricity usage",
        "Electricity",
        "ACTUAL",
        "",
        2.2,
        2.5,
      ),
    } as unknown as Alert;
  },
};
