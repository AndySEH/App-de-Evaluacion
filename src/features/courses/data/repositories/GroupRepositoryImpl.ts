import { Group, NewGroup } from "../../domain/entities/Group";
import { GroupRepository } from "../../domain/repositories/GroupRepository";
import { GroupDataSource } from "../datasources/GroupDataSource";

export class GroupRepositoryImpl implements GroupRepository {
  constructor(private dataSource: GroupDataSource) {}

  async getGroupsByCategory(categoryId: string): Promise<Group[]> {
    return this.dataSource.getGroupsByCategory(categoryId);
  }

  async getGroupById(id: string): Promise<Group | undefined> {
    return this.dataSource.getGroupById(id);
  }

  async addGroup(group: NewGroup): Promise<void> {
    return this.dataSource.addGroup(group);
  }

  async updateGroup(id: string, updates: Partial<Group>): Promise<void> {
    return this.dataSource.updateGroup(id, updates);
  }

  async deleteGroup(id: string): Promise<void> {
    return this.dataSource.deleteGroup(id);
  }
}
