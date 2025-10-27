import { AuthUser } from "../../domain/entities/AuthUser";
import { AuthRepository } from "../../domain/repositories/AuthRepository";
import { AuthRemoteDataSource } from "../datasources/AuthRemoteDataSource";

export class AuthRepositoryImpl implements AuthRepository {
  private dataSource: AuthRemoteDataSource;

  constructor(dataSource: AuthRemoteDataSource) {
    this.dataSource = dataSource;
  }

  async login(email: string, password: string): Promise<void> {
    return this.dataSource.login(email, password);
  }

  async signup(email: string, password: string): Promise<void> {
    return this.dataSource.signUp(email, password);
  }

  async logout(): Promise<void> {
    return this.dataSource.logOut();
  }

  async getCurrentUser(): Promise<AuthUser | null> {
   // return this.dataSource.getCurrentUser();
    return null;
  }
}
