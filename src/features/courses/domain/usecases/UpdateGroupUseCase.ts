import { Group } from "../entities/Group";
import { GroupRepository } from "../repositories/GroupRepository";

export class UpdateGroupUseCase {
  constructor(private repository: GroupRepository) {}

  async execute(id: string, updates: Partial<Group>): Promise<void> {
    return this.repository.updateGroup(id, updates);
  }
}
