import { Category } from "../entities/Category";
import { CategoryRepository } from "../repositories/CategoryRepository";

export class UpdateCategoryUseCase {
  constructor(private repository: CategoryRepository) {}

  async execute(id: string, updates: Partial<Category>): Promise<void> {
    return this.repository.updateCategory(id, updates);
  }
}
