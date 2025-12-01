import { ActivityRepository } from "../repositories/ActivityRepository";

export class GetActivitiesCountByCourseUseCase {
  constructor(private repository: ActivityRepository) {}

  async execute(courseId: string): Promise<number> {
    const activities = await this.repository.getActivitiesByCourse(courseId);
    return activities.length;
  }
}
