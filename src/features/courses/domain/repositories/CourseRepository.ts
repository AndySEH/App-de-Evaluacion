import { Course } from "../entities/Course";

export interface CourseRepository {
  getCoursesByTeacher(teacherId: string): Promise<Course[]>;
  getCoursesByStudent(studentId: string): Promise<Course[]>;
  getCourseById(id: string): Promise<Course | undefined>;
  addCourse(course: Course): Promise<void>;
}
