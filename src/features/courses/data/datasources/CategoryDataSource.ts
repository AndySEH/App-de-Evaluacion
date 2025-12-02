import { Category, NewCategory } from "../../domain/entities/Category";

export interface CategoryDataSource {
  getCategoriesByCourse(courseId: string): Promise<Category[]>;
  getCategoryById(id: string): Promise<Category | undefined>;
  addCategory(category: NewCategory): Promise<void>;
  updateCategory(id: string, updates: Partial<Category>): Promise<void>;
  deleteCategory(id: string): Promise<void>;
}
