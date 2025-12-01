export interface Group {
  _id?: string;
  id?: string;
  courseId: string;
  categoryId: string;
  name: string;
  memberIds: string[]; // JSON array stored as array
}

export type NewGroup = Omit<Group, "_id">;
