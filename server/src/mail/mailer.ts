import nodemailer from "nodemailer";
import { config, type Config } from "../config";
import { logger, type Logger } from "../logger";
import type { EmailTemplate } from "./templates";

/** The part of a nodemailer transport the app relies on (easy to fake in tests). */
export interface MailTransport {
  sendMail(message: {
    from: string;
    to: string;
    subject: string;
    html: string;
  }): Promise<unknown>;
  verify(): Promise<unknown>;
}

export class Mailer {
  constructor(
    private readonly transport: MailTransport | null,
    private readonly options: { from: string; adminEmail: string },
    private readonly log: Logger,
  ) {}

  /** Sends an email; never throws: delivery problems are logged, not propagated. */
  async send(to: string, { subject, html }: EmailTemplate): Promise<void> {
    if (!to) {
      return;
    }
    if (!this.transport) {
      // Without SMTP settings (local run, demo, tests) emails are logged instead of sent.
      this.log.info({ to, subject }, "mail dry-run: email not sent");
      return;
    }
    try {
      await this.transport.sendMail({ from: this.options.from, to, subject, html });
    } catch (err) {
      this.log.error({ err, to, subject }, "failed to send email");
    }
  }

  /** Sends to ADMIN_EMAIL; a no-op when it is not configured. */
  notifyAdmin(template: EmailTemplate): Promise<void> {
    return this.send(this.options.adminEmail, template);
  }

  async verify(): Promise<void> {
    if (!this.transport) {
      this.log.info("SMTP is not configured, emails will be logged only");
      return;
    }
    try {
      await this.transport.verify();
      this.log.info("SMTP server is ready to send messages");
    } catch (err) {
      this.log.error({ err }, "SMTP connection error");
    }
  }
}

export function createMailer(cfg: Config, log: Logger): Mailer {
  const transport = cfg.mail.host
    ? nodemailer.createTransport({
        host: cfg.mail.host,
        port: cfg.mail.port,
        secure: cfg.mail.port === 465,
        auth: { user: cfg.mail.user, pass: cfg.mail.password },
      })
    : null;
  return new Mailer(transport, { from: cfg.mail.from, adminEmail: cfg.adminEmail }, log);
}

// Shared instance for modules that are not wired through the composition root yet.
export const mailer = createMailer(config, logger);
export const sendTemplate = (to: string, template: EmailTemplate) =>
  mailer.send(to, template);
export const notifyAdmin = (template: EmailTemplate) => mailer.notifyAdmin(template);
