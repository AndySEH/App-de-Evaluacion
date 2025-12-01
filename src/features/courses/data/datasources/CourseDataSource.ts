import { Course, NewCourse } from "../../../courses/domain/entities/Course";

export interface CourseDataSource {
  getCoursesByTeacher(teacherId: string): Promise<Course[]>;
  getCoursesByStudent(studentId: string): Promise<Course[]>;
  getCourseById(id: string): Promise<Course | undefined>;
  addCourse(course: NewCourse): Promise<void>;
}
