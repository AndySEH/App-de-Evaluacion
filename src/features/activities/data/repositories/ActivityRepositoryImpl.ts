import { Activity, NewActivity } from "../../domain/entities/Activity";
import { ActivityRepository } from "../../domain/repositories/ActivityRepository";
import { ActivityDataSource } from "../datasources/ActivityDataSource";

export class ActivityRepositoryImpl implements ActivityRepository {
  constructor(private dataSource: ActivityDataSource) {}

  async getActivitiesByCourse(courseId: string): Promise<Activity[]> {
    return this.dataSource.getActivitiesByCourse(courseId);
  }

  async getActivityById(id: string): Promise<Activity | undefined> {
    return this.dataSource.getActivityById(id);
  }

  async addActivity(activity: NewActivity): Promise<void> {
    return this.dataSource.addActivity(activity);
  }

  async updateActivity(id: string, updates: Partial<Activity>): Promise<void> {
    return this.dataSource.updateActivity(id, updates);
  }

  async deleteActivity(id: string): Promise<void> {
    return this.dataSource.deleteActivity(id);
  }
}
