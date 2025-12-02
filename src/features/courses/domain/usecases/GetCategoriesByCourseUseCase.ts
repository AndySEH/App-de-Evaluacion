import { Category } from "../entities/Category";
import { CategoryRepository } from "../repositories/CategoryRepository";

export class GetCategoriesByCourseUseCase {
  constructor(private repository: CategoryRepository) {}

  async execute(courseId: string): Promise<Category[]> {
    return this.repository.getCategoriesByCourse(courseId);
  }
}
