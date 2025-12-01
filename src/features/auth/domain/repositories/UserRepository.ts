import { AuthUser } from "../entities/AuthUser";

export interface UserRepository {
  updateUser(userId: string, userData: Partial<AuthUser>): Promise<AuthUser>;
}
