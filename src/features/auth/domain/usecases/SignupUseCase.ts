import { AuthRepository } from "../../repositories/AuthRepository";
import { AuthUser } from "../AuthUser";

export class SignupUseCase {
  constructor(private repo: AuthRepository) {}

  async execute(email: string, password: string): Promise<AuthUser> {
    return this.repo.signup(email, password);
  }
}
