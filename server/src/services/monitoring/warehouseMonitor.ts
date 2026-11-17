import type { Logger } from "../../logger";
import type { WarehouseSettingsItem, WarehouseSnapshot } from "../../models";
import type { Repositories } from "../../repositories";
import type { SecretBox } from "../../utils/secretBox";
import {
  diffCoefficients,
  formatCoefficientsMessage,
  type WarehouseCoefficient,
} from "./coefficients";
import type { FetchCoefficients } from "./wbCoefficients";

export interface Notifier {
  sendMessage(chatId: number, text: string): Promise<void>;
}

export interface MonitoringSettings {
  enabled: boolean;
  items: WarehouseSettingsItem[];
}

export interface WarehouseMonitorDeps {
  repositories: Pick<Repositories, "users" | "profiles" | "monitoring">;
  fetchCoefficients: FetchCoefficients;
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

/** Polls WB for one profile and notifies its Telegram chat about matching coefficients. */
export class WarehouseChecker {
  private timer: NodeJS.Timeout | null = null;

  constructor(
    private readonly profile: WatchedProfile,
    private settings: MonitoringSettings,
    private snapshot: WarehouseCoefficient[],
    private readonly deps: WarehouseMonitorDeps,
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
    try {
      const incoming = await this.deps.fetchCoefficients(
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
      log.warn({ err }, "warehouse check failed");
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
