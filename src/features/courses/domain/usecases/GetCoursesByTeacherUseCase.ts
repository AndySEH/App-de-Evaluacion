import { Course } from "../entities/Course";
import { CourseRepository } from "../repositories/CourseRepository";

export class GetCoursesByTeacherUseCase {
  constructor(private repo: CourseRepository) {}

  async execute(teacherId: string): Promise<Course[]> {
    return this.repo.getCoursesByTeacher(teacherId);
  }
}
