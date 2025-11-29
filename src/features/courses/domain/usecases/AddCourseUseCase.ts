import { NewCourse } from "../entities/Course";
import { CourseRepository } from "../repositories/CourseRepository";

export class AddCourseUseCase {
  constructor(private repo: CourseRepository) {}

  async execute(course: NewCourse): Promise<void> {
    return this.repo.addCourse(course);
  }
}
