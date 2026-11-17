import type { Logger } from "../../logger";
import type { WarehouseSettingsItem, WarehouseSnapshot } from "../../models";
import type { Repositories } from "../../repositories";
import type { SecretBox } from "../../utils/secretBox";
import {
  diffCoefficients,
  formatCoefficientsMessage,
  type WarehouseCoefficient,
} from "./coefficients";
import { WbAuthError } from "../../integrations/wb/errors";
import type { WbClient } from "../../integrations/wb/wbClient";

export interface Notifier {
  sendMessage(chatId: number, text: string): Promise<void>;
}

export interface MonitoringSettings {
  enabled: boolean;
  items: WarehouseSettingsItem[];
}

export interface WarehouseMonitorDeps {
  repositories: Pick<Repositories, "users" | "profiles" | "monitoring">;
  wbClient: Pick<WbClient, "getAcceptanceCoefficients">;
  notifier: Notifier;
  intervalMs: number;
  secretBox: SecretBox;
  log: Logger;
}

interface WatchedProfile {
  id: string;
  chatId: number;
  wbApiKey: string;
}

export const INVALID_KEY_MESSAGE =
  "Ключ API Wildberries больше не действует, мониторинг коэффициентов остановлен. " +
  "Обновите ключ в настройках личного кабинета, и мониторинг включится снова.";

/** Polls WB for one profile and notifies its Telegram chat about matching coefficients. */
export class WarehouseChecker {
  private timer: NodeJS.Timeout | null = null;
  private running = false;

  constructor(
    private readonly profile: WatchedProfile,
    private settings: MonitoringSettings,
    private snapshot: WarehouseCoefficient[],
    private readonly deps: WarehouseMonitorDeps,
    /** called when WB rejects the key: the monitor drops this checker */
    private readonly onKeyRejected: () => void = () => {},
  ) {}

  get isChecking(): boolean {
    return this.timer !== null;
  }

  start(): void {
    if (!this.timer) {
      this.timer = setInterval(() => void this.performCheck(), this.deps.intervalMs);
    }
  }

  stop(): void {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }

  restart(settings: MonitoringSettings): void {
    this.settings = settings;
    this.snapshot = [];
    this.stop();
    this.start();
  }

  async performCheck(): Promise<void> {
    const log = this.deps.log.child({ profileId: this.profile.id });
    // A slow WB response must not lead to overlapping checks for the same profile.
    if (this.running) {
      log.debug("previous check is still running, skipping this tick");
      return;
    }
    this.running = true;
    try {
      const incoming = await this.deps.wbClient.getAcceptanceCoefficients(
        this.profile.wbApiKey,
        this.settings.items.map((item) => item.ID),
      );
      const { toNotify, previous, nextSnapshot } = diffCoefficients(
        this.snapshot,
        incoming,
        this.settings.items,
      );
      if (toNotify.length) {
        await this.deps.notifier.sendMessage(
          this.profile.chatId,
          formatCoefficientsMessage(toNotify, previous),
        );
      }
      if (nextSnapshot) {
        this.snapshot = nextSnapshot;
        const stored: WarehouseSnapshot = {
          items: nextSnapshot,
          userProfileId: this.profile.id,
        };
        await this.deps.repositories.monitoring.saveSnapshot(stored);
      }
    } catch (err) {
      if (err instanceof WbAuthError) {
        // Polling with a dead key would fail forever: stop and tell the seller once.
        log.warn("WB rejected the API key, monitoring stopped");
        this.stop();
        this.onKeyRejected();
        await this.deps.notifier
          .sendMessage(this.profile.chatId, INVALID_KEY_MESSAGE)
          .catch((notifyErr: unknown) =>
            log.error({ err: notifyErr }, "notification failed"),
          );
        return;
      }
      log.warn({ err }, "warehouse check failed");
    } finally {
      this.running = false;
    }
  }
}

/** Keeps one WarehouseChecker per profile with monitoring enabled and a linked chat. */
export class WarehouseMonitor {
  private readonly checkers = new Map<string, WarehouseChecker>();
  private initialized = false;

  constructor(private readonly deps: WarehouseMonitorDeps) {}

  get isInitialized(): boolean {
    return this.initialized;
  }

  getChecker(profileId: string): WarehouseChecker | undefined {
    return this.checkers.get(profileId);
  }

  async initialize(): Promise<void> {
    if (this.initialized) {
      return;
    }
    const users = await this.deps.repositories.users.findAll();
    for (const user of users) {
      try {
        await this.addChecker(user.profileId);
      } catch (err) {
        this.deps.log.error(
          { err, profileId: user.profileId },
          "failed to start checker",
        );
      }
    }
    this.initialized = true;
    this.deps.log.info(
      { checkers: this.checkers.size },
      "warehouse monitoring initialized",
    );
  }

  async addChecker(profileId: string): Promise<void> {
    const { profiles, monitoring } = this.deps.repositories;
    const [profile, settings, snapshot] = await Promise.all([
      profiles.findById(profileId),
      monitoring.getSettings(profileId),
      monitoring.getSnapshot(profileId),
    ]);
    // Nothing to monitor: no profile, no settings, monitoring off or no chat linked
    if (
      !profile ||
      !settings ||
      !settings.enabled ||
      !profile.chatId ||
      !profile.wbApiKeyEncrypted
    ) {
      return;
    }
    // Never keep two interval loops for the same profile
    this.removeChecker(profileId);

    const checker = new WarehouseChecker(
      {
        id: profileId,
        chatId: profile.chatId,
        wbApiKey: this.deps.secretBox.decrypt(profile.wbApiKeyEncrypted),
      },
      { enabled: settings.enabled, items: settings.items },
      snapshot?.items ?? [],
      this.deps,
      () => this.checkers.delete(profileId),
    );
    checker.start();
    this.checkers.set(profileId, checker);
  }

  removeChecker(profileId: string): void {
    this.checkers.get(profileId)?.stop();
    this.checkers.delete(profileId);
  }

  async changeSettings(profileId: string, settings: MonitoringSettings): Promise<void> {
    const checker = this.checkers.get(profileId);
    const active = settings.enabled && settings.items.length > 0;
    if (!checker) {
      if (active) {
        await this.addChecker(profileId);
      }
      return;
    }
    if (!active) {
      this.removeChecker(profileId);
      return;
    }
    checker.restart(settings);
  }

  stopAll(): void {
    for (const checker of this.checkers.values()) {
      checker.stop();
    }
    this.checkers.clear();
  }
}
