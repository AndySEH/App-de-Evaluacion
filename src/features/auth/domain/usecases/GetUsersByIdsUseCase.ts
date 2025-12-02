import { AuthUser } from "../entities/AuthUser";
import { UserRepository } from "../repositories/UserRepository";

export class GetUsersByIdsUseCase {
  constructor(private repository: UserRepository) {}

  async execute(userIds: string[]): Promise<AuthUser[]> {
    return this.repository.getUsersByIds(userIds);
  }
}
