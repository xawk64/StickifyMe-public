import { NotFoundError } from "../errors";
import * as templates from "../mail/templates";
import type { Order } from "../models";
import type { HistoryDocument, HistorySummary, Repositories } from "../repositories";
import type { MailSender } from "./auth.service";

export interface HistoryServiceDeps {
  repositories: Pick<Repositories, "users" | "history">;
  mailer: MailSender;
}

export class HistoryService {
  constructor(private readonly deps: HistoryServiceDeps) {}

  /** Saves a prepared batch of labels and returns the id of the history entry. */
  async add(userId: string, type: string | undefined, orders: Order[]): Promise<string> {
    const user = await this.deps.repositories.users.findById(userId);
    if (!user) {
      throw new NotFoundError("Пользователь не найден");
    }
    const entry = await this.deps.repositories.history.create(userId, type, orders);
    await this.deps.mailer.notifyAdmin(
      templates.adminLabelsHistory({
        username: user.username,
        ordersCount: orders.length,
      }),
    );
    return String(entry._id);
  }

  list(
    userId: string,
    page: number,
    limit: number,
  ): Promise<{ items: HistorySummary[]; count: number }> {
    return this.deps.repositories.history.findPage(userId, page, limit);
  }

  /** Another user's entry looks exactly like a missing one. */
  async get(userId: string, historyId: string): Promise<HistoryDocument | null> {
    const entry = await this.deps.repositories.history.findById(historyId);
    return entry && entry.userId === userId ? entry : null;
  }
}
