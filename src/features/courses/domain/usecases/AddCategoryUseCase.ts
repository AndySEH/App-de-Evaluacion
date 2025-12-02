import { NewCategory } from "../entities/Category";
import { CategoryRepository } from "../repositories/CategoryRepository";

export class AddCategoryUseCase {
  constructor(private repository: CategoryRepository) {}

  async execute(category: NewCategory): Promise<void> {
    return this.repository.addCategory(category);
  }
}
