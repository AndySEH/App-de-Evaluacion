import { Course } from "../../domain/entities/Course";
import { CourseRepository } from "../../domain/repositories/CourseRepository";
import { CourseDataSource } from "../datasources/CourseDataSource";

export class CourseRepositoryImpl implements CourseRepository {
  constructor(private remote: CourseDataSource) {}

  async getCoursesByTeacher(teacherId: string): Promise<Course[]> {
    return this.remote.getCoursesByTeacher(teacherId);
  }

  async getCoursesByStudent(studentId: string): Promise<Course[]> {
    return this.remote.getCoursesByStudent(studentId);
  }

  async getCourseById(id: string): Promise<Course | undefined> {
    return this.remote.getCourseById(id);
  }

  async addCourse(course: Course): Promise<void> {
    return this.remote.addCourse(course as any);
  }
}
