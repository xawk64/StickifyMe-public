import { NotFoundError } from "../errors";
import * as templates from "../mail/templates";
import type { Repositories } from "../repositories";
import type { MailSender } from "./auth.service";

export interface SupportServiceDeps {
  repositories: Pick<Repositories, "users" | "feedback">;
  mailer: MailSender;
}

export class SupportService {
  constructor(private readonly deps: SupportServiceDeps) {}

  async sendFeedback(
    userId: string,
    { type, message }: { type: string; message: string },
  ) {
    const user = await this.deps.repositories.users.findById(userId);
    if (!user) {
      throw new NotFoundError("Пользователь не найден");
    }
    await this.deps.repositories.feedback.create({
      message,
      type,
      userId: user.id,
      userEmail: user.email,
    });
    await this.deps.mailer.notifyAdmin(
      templates.adminSupportRequest({ email: user.email, type, message }),
    );
  }
}
