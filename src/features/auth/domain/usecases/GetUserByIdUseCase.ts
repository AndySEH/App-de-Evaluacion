import { AuthUser } from "../entities/AuthUser";
import { UserRepository } from "../repositories/UserRepository";

export class GetUserByIdUseCase {
  constructor(private repository: UserRepository) {}

  async execute(userId: string): Promise<AuthUser | null> {
    return this.repository.getUserById(userId);
  }
}
