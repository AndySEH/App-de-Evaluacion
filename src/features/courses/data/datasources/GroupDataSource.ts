import { Group, NewGroup } from "../../domain/entities/Group";

export interface GroupDataSource {
  getGroupsByCategory(categoryId: string): Promise<Group[]>;
  getGroupById(id: string): Promise<Group | undefined>;
  addGroup(group: NewGroup): Promise<void>;
  updateGroup(id: string, updates: Partial<Group>): Promise<void>;
  deleteGroup(id: string): Promise<void>;
}
