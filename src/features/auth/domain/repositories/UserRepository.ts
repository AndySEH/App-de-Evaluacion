import { AuthUser } from "../entities/AuthUser";

export interface UserRepository {
  updateUser(userId: string, userData: Partial<AuthUser>): Promise<AuthUser>;
  getUserById(userId: string): Promise<AuthUser | null>;
  getUsersByIds(userIds: string[]): Promise<AuthUser[]>;
}
