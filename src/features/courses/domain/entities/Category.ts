export interface Category {
  _id?: string;
  id?: string;
  courseId: string;
  name: string;
  randomGroups: boolean;
  maxStudentsPerGroup?: number;
}

export type NewCategory = Omit<Category, "_id">;
