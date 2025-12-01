import { Activity, NewActivity } from "../../domain/entities/Activity";

export interface ActivityDataSource {
  getActivitiesByCourse(courseId: string): Promise<Activity[]>;
  getActivityById(id: string): Promise<Activity | undefined>;
  addActivity(activity: NewActivity): Promise<void>;
  updateActivity(id: string, updates: Partial<Activity>): Promise<void>;
  deleteActivity(id: string): Promise<void>;
}
