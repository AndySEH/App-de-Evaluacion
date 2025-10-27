import { AuthRepository } from "../../repositories/AuthRepository";
import { AuthUser } from "../AuthUser";

export class LoginUseCase {
  constructor(private repo: AuthRepository) {}

  async execute(email: string, password: string): Promise<AuthUser> {
    return this.repo.login(email, password);
  }
}
