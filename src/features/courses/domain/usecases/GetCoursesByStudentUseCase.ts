import { Course } from "../entities/Course";
import { CourseRepository } from "../repositories/CourseRepository";

export class GetCoursesByStudentUseCase {
	constructor(private repository: CourseRepository) {}

	async execute(studentId: string): Promise<Course[]> {
		return this.repository.getCoursesByStudent(studentId);
	}
}
