import { AuthRepository } from "../../repositories/AuthRepository";
import { AuthUser } from "../AuthUser";

export class SignupUseCase {
  constructor(private repo: AuthRepository) {}

  async execute(email: string, password: string): Promise<AuthUser> {
    await this.repo.signup(email, password);
    // After signup, need to login to get the user and tokens
    await this.repo.login(email, password);
    const user = await this.repo.getCurrentUser();
    if (!user) {
      throw new Error("Failed to retrieve user after signup");
    }
    return user;
  }
}
