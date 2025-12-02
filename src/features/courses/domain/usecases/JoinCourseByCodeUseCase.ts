import { Course } from "../entities/Course";
import { CourseRepository } from "../repositories/CourseRepository";

export class JoinCourseByCodeUseCase {
  constructor(private repository: CourseRepository) {}

  async execute(studentId: string, registrationCode: string): Promise<Course> {
    if (!studentId || !registrationCode) {
      throw new Error("Student ID and registration code are required");
    }

    return this.repository.joinCourseByCode(studentId, registrationCode);
  }
}
