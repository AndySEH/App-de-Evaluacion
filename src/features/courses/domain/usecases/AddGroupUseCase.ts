import { NewGroup } from "../entities/Group";
import { GroupRepository } from "../repositories/GroupRepository";

export class AddGroupUseCase {
  constructor(private repository: GroupRepository) {}

  async execute(group: NewGroup): Promise<void> {
    return this.repository.addGroup(group);
  }
}
