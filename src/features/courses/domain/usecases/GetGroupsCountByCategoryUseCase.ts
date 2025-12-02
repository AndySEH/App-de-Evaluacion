import { GroupRepository } from "../repositories/GroupRepository";

export class GetGroupsCountByCategoryUseCase {
  constructor(private repository: GroupRepository) {}

  async execute(categoryId: string): Promise<number> {
    const groups = await this.repository.getGroupsByCategory(categoryId);
    return groups.length;
  }
}
