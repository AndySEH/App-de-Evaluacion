import { GroupRepository } from "../repositories/GroupRepository";

export class DeleteGroupUseCase {
  constructor(private repository: GroupRepository) {}

  async execute(id: string): Promise<void> {
    return this.repository.deleteGroup(id);
  }
}
