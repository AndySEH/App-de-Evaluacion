import { Activity, NewActivity } from "../entities/Activity";

export interface ActivityRepository {
  getActivitiesByCourse(courseId: string): Promise<Activity[]>;
  getActivityById(id: string): Promise<Activity | undefined>;
  addActivity(activity: NewActivity): Promise<void>;
  updateActivity(id: string, updates: Partial<Activity>): Promise<void>;
  deleteActivity(id: string): Promise<void>;
}
