import { AuthUser } from "../../domain/entities/AuthUser";

export interface UserDataSource {
  updateUser(userId: string, userData: Partial<AuthUser>): Promise<AuthUser>;
  getUserById(userId: string): Promise<AuthUser | null>;
  getUsersByIds(userIds: string[]): Promise<AuthUser[]>;
}
