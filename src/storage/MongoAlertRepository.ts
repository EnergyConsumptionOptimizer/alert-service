import * as AlertMapper from "./AlertMapper";
import { AlertRepository } from "@domain/port/AlertRepository";
import { AlertModel } from "./AlertSchema";
import { AlertId } from "@domain/value/AlertId";
import { Alert } from "@domain/Alert";

/**
 * MongoDB implementation of `AlertRepository` using Mongoose.
 */
export class MongoAlertRepository implements AlertRepository {
  /**
   * Persists the alert to MongoDB (upsert).
   *
   * @param alert - The domain alert to persist.
   */
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

  async countUnread(): Promise<number> {
    return AlertModel.countDocuments({
      $or: [{ readAt: null }, { readAt: { $exists: false } }],
    }).exec();
  }

  async deleteOne(id: AlertId): Promise<void> {
    await AlertModel.deleteOne({ _id: id.value }).exec();
  }

  async deleteAll(): Promise<void> {
    await AlertModel.deleteMany({}).exec();
  }
}
