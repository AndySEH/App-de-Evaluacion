import { AuthUser } from "../../domain/entities/AuthUser";
import { UserRepository } from "../../domain/repositories/UserRepository";
import { UserDataSource } from "../datasources/UserDataSource";

export class UserRepositoryImpl implements UserRepository {
  constructor(private dataSource: UserDataSource) {}

  async updateUser(userId: string, userData: Partial<AuthUser>): Promise<AuthUser> {
    return this.dataSource.updateUser(userId, userData);
  }

  async getUserById(userId: string): Promise<AuthUser | null> {
    return this.dataSource.getUserById(userId);
  }

  async getUsersByIds(userIds: string[]): Promise<AuthUser[]> {
    return this.dataSource.getUsersByIds(userIds);
  }
}
