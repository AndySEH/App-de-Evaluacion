import { NewGroup } from "../entities/Group";
import { GroupRepository } from "../repositories/GroupRepository";

export class AddGroupUseCase {
  constructor(private repository: GroupRepository) {}

  async execute(group: NewGroup): Promise<void> {
    console.log('[AddGroupUseCase] Executing with group:', JSON.stringify(group, null, 2));
    try {
      const result = await this.repository.addGroup(group);
      console.log('[AddGroupUseCase] Group added successfully');
      return result;
    } catch (error) {
      console.error('[AddGroupUseCase] Error adding group:', error);
      throw error;
    }
  }
}
