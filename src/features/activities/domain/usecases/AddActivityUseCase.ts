import { NewActivity } from "../entities/Activity";
import { ActivityRepository } from "../repositories/ActivityRepository";

export class AddActivityUseCase {
  constructor(private repository: ActivityRepository) {}

  async execute(activity: NewActivity): Promise<void> {
    return this.repository.addActivity(activity);
  }
}
