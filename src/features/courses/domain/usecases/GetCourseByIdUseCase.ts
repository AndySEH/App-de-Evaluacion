import { Course } from "../entities/Course";
import { CourseRepository } from "../repositories/CourseRepository";

export class GetCourseByIdUseCase {
  constructor(private repo: CourseRepository) {}

  async execute(id: string): Promise<Course | undefined> {
    return this.repo.getCourseById(id);
  }
}
