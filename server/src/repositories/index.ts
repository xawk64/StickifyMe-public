import { FeedbackRepository } from "./feedback.repository";
import { HistoryRepository } from "./history.repository";
import { MonitoringRepository } from "./monitoring.repository";
import { ProfileRepository } from "./profile.repository";
import { UserRepository } from "./user.repository";

export * from "./feedback.repository";
export * from "./history.repository";
export * from "./monitoring.repository";
export * from "./profile.repository";
export * from "./user.repository";

export interface Repositories {
  users: UserRepository;
  profiles: ProfileRepository;
  monitoring: MonitoringRepository;
  history: HistoryRepository;
  feedback: FeedbackRepository;
}

export function createRepositories(): Repositories {
  return {
    users: new UserRepository(),
    profiles: new ProfileRepository(),
    monitoring: new MonitoringRepository(),
    history: new HistoryRepository(),
    feedback: new FeedbackRepository(),
  };
}
