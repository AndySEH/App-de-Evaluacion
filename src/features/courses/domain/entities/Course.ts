export interface Course {
  _id?: string;
  id?: string;
  name: string;
  description?: string;
  teacherId: string;
  registrationCode?: string;
  studentIds?: string[]; // JSON array
  invitations?: any[]; // JSON array
  studentsCount?: number;
}

export type NewCourse = Omit<Course, "_id">;
