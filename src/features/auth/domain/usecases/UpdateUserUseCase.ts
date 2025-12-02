import { AuthUser } from "../entities/AuthUser";
import { UserRepository } from "../repositories/UserRepository";

export class UpdateUserUseCase {
  constructor(private repository: UserRepository) {}

  async execute(userId: string, userData: Partial<AuthUser>): Promise<AuthUser> {
    return this.repository.updateUser(userId, userData);
  }
}
