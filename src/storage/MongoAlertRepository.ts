import * as AlertMapper from "@storage/AlertMapper";
import { AlertRepository } from "@domain/port/AlertRepository";
import { AlertModel } from "storage/AlertSchema";
import { AlertId } from "@domain/value/AlertId";
import { Alert } from "@domain/Alert";

export class MongoAlertRepository implements AlertRepository {
  async save(alert: Alert): Promise<void> {
    const raw = AlertMapper.toPersistence(alert);
    await AlertModel.findByIdAndUpdate(raw._id, raw, {
      upsert: true,
      new: true,
      runValidators: true,
    }).exec();
  }

  async findById(id: AlertId): Promise<Alert | null> {
    const doc = await AlertModel.findById(id.value).exec();
    return doc ? AlertMapper.toDomain(doc) : null;
  }

  async findAll(): Promise<Alert[]> {
    const docs = await AlertModel.find().sort({ createdAt: -1 }).exec();
    return docs.map(AlertMapper.toDomain);
  }
}
