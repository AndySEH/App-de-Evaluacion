import { AuthRepository } from "../../repositories/AuthRepository";
import { AuthUser } from "../AuthUser";

export class LoginUseCase {
  constructor(private repo: AuthRepository) {}

  async execute(email: string, password: string): Promise<AuthUser> {
    await this.repo.login(email, password);
    const user = await this.repo.getCurrentUser();
    if (!user) {
      throw new Error("Failed to retrieve user after login");
    }
    return user;
  }
}
