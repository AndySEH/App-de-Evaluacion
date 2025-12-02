import { ILocalPreferences } from "@/src/core/iLocalPreferences";
import { LocalPreferencesAsyncStorage } from "@/src/core/LocalPreferencesAsyncStorage";
import { AuthRemoteDataSource } from "./AuthRemoteDataSource";

export class AuthRemoteDataSourceImpl implements AuthRemoteDataSource {
  private readonly projectId: string;
  private readonly baseUrl: string;

  private prefs: ILocalPreferences;

  constructor(projectId = process.env.EXPO_PUBLIC_ROBLE_PROJECT_ID) {
    if (!projectId) {
      throw new Error("Missing EXPO_PUBLIC_ROBLE_PROJECT_ID env var");
    }
    this.projectId = projectId;
    this.baseUrl = `https://roble-api.openlab.uninorte.edu.co/auth/${this.projectId}`;
    this.prefs = LocalPreferencesAsyncStorage.getInstance();
  }

  async login(email: string, password: string): Promise<void> {
    console.log('[API] POST Login - Params:', { email });
    try {
      const response = await fetch(`${this.baseUrl}/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json; charset=UTF-8" },
        body: JSON.stringify({ email, password }),
      });

      if (response.status === 201) {
        const data = await response.json();
        const token = data["accessToken"];
        const refreshToken = data["refreshToken"];
        await this.prefs.storeData("token", token);
        await this.prefs.storeData("refreshToken", refreshToken);
        const serverUser = data["user"] ?? { email };
        await this.prefs.storeData("user", serverUser);
        console.log('[API] POST Login - Result: Success', { user: serverUser });
        return Promise.resolve();
      } else {
        const body = await response.json();
        console.error('[API] POST Login - Error:', response.status, body);
        throw new Error(`Login error: ${body.message}`);
      }
    } catch (e: any) {
      console.error('[API] POST Login - Exception:', e);
      throw e;
    }
  }

  async signUp(email: string, password: string): Promise<void> {
    console.log('[API] POST Signup - Params:', { email });
    try {
      const response = await fetch(`${this.baseUrl}/signup`, {
        method: "POST",
        headers: { "Content-Type": "application/json; charset=UTF-8" },
        body: JSON.stringify({
          email: email,
          name: email.split("@")[0],
          password: password,
        }),
      });

      if (response.status === 201) {
        console.log('[API] POST Signup - Result: Success');
        return Promise.resolve();
      } else {
        const body = await response.json();
        console.error('[API] POST Signup - Error:', response.status, body);
        throw new Error(`Signup error: ${(body.message || []).join(" ")}`);
      }
    } catch (e: any) {
      console.error('[API] POST Signup - Exception:', e);
      throw e;
    }
  }

  async logOut(): Promise<void> {
    console.log('[API] POST Logout - Params: {}');
    try {
      const token = await this.prefs.retrieveData<string>("token");
      if (!token) throw new Error("No token found");

      const response = await fetch(`${this.baseUrl}/logout`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.status === 201) {
        await this.prefs.removeData("token");
        await this.prefs.removeData("refreshToken");
        console.log('[API] POST Logout - Result: Success');
        return Promise.resolve();
      } else {
        const body = await response.json();
        console.error('[API] POST Logout - Error:', response.status, body);
        throw new Error(`Logout error: ${body.message}`);
      }
    } catch (e: any) {
      console.error('[API] POST Logout - Exception:', e);
      throw e;
    }
  }
  async validate(email: string, validationCode: string): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/verify-email`, {
        method: "POST",
        headers: { "Content-Type": "application/json; charset=UTF-8" },
        body: JSON.stringify({ email, code: validationCode }),
      });

      if (response.status === 201) {
        return true;
      } else {
        const body = await response.json();
        throw new Error(`Validation error: ${body.message}`);
      }
    } catch (e: any) {
      console.error("Validation failed", e);
      throw e;
    }
  }

  async refreshToken(): Promise<boolean> {
    console.log('[API] POST Refresh Token - Params: {}');
    try {
      const refreshToken = await this.prefs.retrieveData<string>(
        "refreshToken"
      );
      if (!refreshToken) throw new Error("No refresh token found");

      const response = await fetch(`${this.baseUrl}/refresh-token`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refreshToken }),
      });

      if (response.status === 201) {
        const data = await response.json();
        const newToken = data["accessToken"];
        await this.prefs.storeData("token", newToken);
        if (data["user"]) {
          await this.prefs.storeData("user", data["user"]);
        }
        console.log('[API] POST Refresh Token - Result: Success');
        return true;
      } else {
        const body = await response.json();
        console.error('[API] POST Refresh Token - Error:', response.status, body);
        throw new Error(`Refresh token error: ${body.message}`);
      }
    } catch (e: any) {
      console.error('[API] POST Refresh Token - Exception:', e);
      throw e;
    }
  }
  forgotPassword(email: string): Promise<boolean> {
    throw new Error("Method not implemented.");
  }
  resetPassword(
    email: string,
    newPassword: string,
    validationCode: string
  ): Promise<boolean> {
    throw new Error("Method not implemented.");
  }
  async verifyToken(): Promise<boolean> {
    console.log('[API] GET Verify Token - Params: {}');
    try {
      const token = await this.prefs.retrieveData<string>("token");
      if (!token) {
        console.log('[API] GET Verify Token - Result: No token found');
        return false;
      }

      const response = await fetch(`${this.baseUrl}/verify-token`, {
        method: "GET",
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.status === 200) {
        console.log('[API] GET Verify Token - Result: Valid');
        return true;
      } else {
        const body = await response.json();
        console.error('[API] GET Verify Token - Error:', response.status, body);
        return false;
      }
    } catch (e: any) {
      console.error('[API] GET Verify Token - Exception:', e);
      return false;
    }
  }

  // Expose stored auth info (user + tokens) for consumers that need raw data
  async getStoredAuthInfo(): Promise<{ user: any | null; token: string | null; refreshToken: string | null }> {
    const user = await this.prefs.retrieveData<any>("user");
    const token = await this.prefs.retrieveData<string>("token");
    const refreshToken = await this.prefs.retrieveData<string>("refreshToken");
    return { user, token, refreshToken };
  }
}
