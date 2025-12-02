export interface Invitation {
  id?: string;
  courseId: string;
  courseName: string;
  teacherId: string;
  teacherName?: string;
  studentEmail: string;
  createdAt?: string;
  status?: 'pending' | 'accepted' | 'rejected';
}
