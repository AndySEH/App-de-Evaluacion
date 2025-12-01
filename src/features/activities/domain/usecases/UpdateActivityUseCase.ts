import { Activity } from "../entities/Activity";
import { ActivityRepository } from "../repositories/ActivityRepository";

export class UpdateActivityUseCase {
  constructor(private repository: ActivityRepository) {}

  async execute(id: string, updates: Partial<Activity>): Promise<void> {
    return this.repository.updateActivity(id, updates);
  }
}
