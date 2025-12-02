import { Activity } from "../entities/Activity";
import { ActivityRepository } from "../repositories/ActivityRepository";

export class GetActivityByIdUseCase {
  constructor(private repository: ActivityRepository) {}

  async execute(id: string): Promise<Activity | undefined> {
    return this.repository.getActivityById(id);
  }
}
