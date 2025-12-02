import { Group } from "../entities/Group";
import { GroupRepository } from "../repositories/GroupRepository";

export class GetGroupsByCategoryUseCase {
  constructor(private repository: GroupRepository) {}

  async execute(categoryId: string): Promise<Group[]> {
    return this.repository.getGroupsByCategory(categoryId);
  }
}
