import { AuthUser } from "../../domain/entities/AuthUser";
import { UserRepository } from "../../domain/repositories/UserRepository";
import { UserDataSource } from "../datasources/UserDataSource";

export class UserRepositoryImpl implements UserRepository {
  constructor(private dataSource: UserDataSource) {}

  async updateUser(userId: string, userData: Partial<AuthUser>): Promise<AuthUser> {
    return this.dataSource.updateUser(userId, userData);
  }
}
