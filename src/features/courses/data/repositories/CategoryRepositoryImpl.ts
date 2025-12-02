import { Category, NewCategory } from "../../domain/entities/Category";
import { CategoryRepository } from "../../domain/repositories/CategoryRepository";
import { CategoryDataSource } from "../datasources/CategoryDataSource";

export class CategoryRepositoryImpl implements CategoryRepository {
  constructor(private dataSource: CategoryDataSource) {}

  async getCategoriesByCourse(courseId: string): Promise<Category[]> {
    return this.dataSource.getCategoriesByCourse(courseId);
  }

  async getCategoryById(id: string): Promise<Category | undefined> {
    return this.dataSource.getCategoryById(id);
  }

  async addCategory(category: NewCategory): Promise<void> {
    return this.dataSource.addCategory(category);
  }

  async updateCategory(id: string, updates: Partial<Category>): Promise<void> {
    return this.dataSource.updateCategory(id, updates);
  }

  async deleteCategory(id: string): Promise<void> {
    return this.dataSource.deleteCategory(id);
  }
}
