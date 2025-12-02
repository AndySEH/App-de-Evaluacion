
export interface AuthRemoteDataSource {
  login(email: string, password: string): Promise<void>;
  signUp(email: string, password: string): Promise<void>;
  logOut(): Promise<void>;
  validate(email: string, validationCode: string): Promise<boolean>;
  refreshToken(): Promise<boolean>;
  forgotPassword(email: string): Promise<boolean>;
  resetPassword(email: string, newPassword: string, validationCode: string): Promise<boolean>;
  verifyToken(): Promise<boolean>;
  getStoredAuthInfo(): Promise<{ user: any | null; token: string | null; refreshToken: string | null }>;
}