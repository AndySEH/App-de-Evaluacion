import { AuthRepository } from "../../repositories/AuthRepository";
import { AuthUser } from "../AuthUser";


export class GetCurrentUserUseCase {
  constructor(private repository: AuthRepository) {}

  async execute(): Promise<AuthUser | null> {
    return this.repository.getCurrentUser();
  }
}
