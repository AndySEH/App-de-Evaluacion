import { Category } from "../entities/Category";
import { CategoryRepository } from "../repositories/CategoryRepository";

export class GetCategoryByIdUseCase {
  constructor(private repository: CategoryRepository) {}

  async execute(id: string): Promise<Category | undefined> {
    return this.repository.getCategoryById(id);
  }
}
