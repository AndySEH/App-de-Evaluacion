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
  activitiesCount?: number; // Campo para almacenar el conteo de actividades
}

export type NewCourse = Omit<Course, "_id">;
