import { ActivityRepository } from "../repositories/ActivityRepository";

export class DeleteActivityUseCase {
  constructor(private repository: ActivityRepository) {}

  async execute(id: string): Promise<void> {
    return this.repository.deleteActivity(id);
  }
}
