import { Activity } from "../entities/Activity";
import { ActivityRepository } from "../repositories/ActivityRepository";

export class GetActivitiesByCourseUseCase {
  constructor(private repository: ActivityRepository) {}

  async execute(courseId: string): Promise<Activity[]> {
    return this.repository.getActivitiesByCourse(courseId);
  }
}
