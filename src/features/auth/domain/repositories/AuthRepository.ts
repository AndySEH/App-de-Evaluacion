import { AuthUser } from "../entities/AuthUser";

export interface AuthRepository {
  login(email: string, password: string): Promise<void>;
  signup(email: string, password: string): Promise<void>;
  logout(): Promise<void>;
  getCurrentUser(): Promise<AuthUser | null>;
}
