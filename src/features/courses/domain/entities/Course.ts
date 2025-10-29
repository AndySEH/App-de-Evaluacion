export interface Course {
  _id?: string;
  title: string;
  description?: string;
  teacherId: string;
  studentsCount?: number;
}

export type NewCourse = Omit<Course, "_id">;
