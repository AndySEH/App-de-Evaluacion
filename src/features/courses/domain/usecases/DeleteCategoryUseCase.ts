import { CategoryRepository } from "../repositories/CategoryRepository";

export class DeleteCategoryUseCase {
  constructor(private repository: CategoryRepository) {}

  async execute(id: string): Promise<void> {
    return this.repository.deleteCategory(id);
  }
}
