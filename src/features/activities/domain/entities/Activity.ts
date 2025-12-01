export interface Activity {
  _id?: string;
  id?: string;
  courseId: string;
  categoryId: string;
  name: string;
  description?: string;
  visible: boolean;
  dueDate?: string; // ISO string format
}

export type NewActivity = Omit<Activity, "_id">;
