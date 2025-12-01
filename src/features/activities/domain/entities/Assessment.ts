export interface Assessment {
  _id?: string;
  id?: string;
  courseId: string;
  activityId: string;
  title: string;
  durationMinutes: number;
  startAt?: string; // ISO string format
  gradesVisible: boolean;
  cancelled: boolean;
  endAt?: string; // ISO string format
}

export type NewAssessment = Omit<Assessment, "_id">;
