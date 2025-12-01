import { AuthUser } from "../../domain/entities/AuthUser";

export interface UserDataSource {
  updateUser(userId: string, userData: Partial<AuthUser>): Promise<AuthUser>;
}
