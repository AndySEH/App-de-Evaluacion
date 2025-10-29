import { Course, NewCourse } from "../entities/Course";

export interface CourseRepository {
  getCoursesByTeacher(teacherId: string): Promise<Course[]>;
  getCourseById(id: string): Promise<Course | undefined>;
  addCourse(course: NewCourse): Promise<void>;
}
