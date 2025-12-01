import { Category, NewCategory } from "../entities/Category";

export interface CategoryRepository {
  getCategoriesByCourse(courseId: string): Promise<Category[]>;
  getCategoryById(id: string): Promise<Category | undefined>;
  addCategory(category: NewCategory): Promise<void>;
  updateCategory(id: string, updates: Partial<Category>): Promise<void>;
  deleteCategory(id: string): Promise<void>;
}
