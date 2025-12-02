import { Group } from "../entities/Group";
import { GroupRepository } from "../repositories/GroupRepository";

export class GetGroupByIdUseCase {
  constructor(private repository: GroupRepository) {}

  async execute(id: string): Promise<Group | undefined> {
    return this.repository.getGroupById(id);
  }
}
