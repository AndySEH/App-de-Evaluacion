import { ILocalPreferences } from "@/src/core/iLocalPreferences";
import { LocalPreferencesAsyncStorage } from "@/src/core/LocalPreferencesAsyncStorage";
import { AuthUser } from "../../domain/entities/AuthUser";
import { AuthRemoteDataSource } from "./AuthRemoteDataSource";
import { UserDataSource } from "./UserDataSource";

export class UserRemoteDataSourceImpl implements UserDataSource {
  private readonly baseUrl: string;
  private readonly table: string = "UserModel";
  private prefs: ILocalPreferences;
  private authDataSource: AuthRemoteDataSource;

  constructor(authDataSource: AuthRemoteDataSource) {
    this.baseUrl = "https://roble-api.openlab.uninorte.edu.co/database";
    this.prefs = LocalPreferencesAsyncStorage.getInstance();
    this.authDataSource = authDataSource;
  }

  private async authorizedFetch(url: string, options: RequestInit): Promise<Response> {
    const token = await this.prefs.retrieveData<string>("token");
    if (!token) throw new Error("No token found");

    const headers = {
      ...options.headers,
      Authorization: `Bearer ${token}`,
    };

    let response = await fetch(url, { ...options, headers });

    if (response.status === 401) {
      const refreshed = await this.authDataSource.refreshToken();
      if (refreshed) {
        const newToken = await this.prefs.retrieveData<string>("token");
        headers.Authorization = `Bearer ${newToken}`;
        response = await fetch(url, { ...options, headers });
      }
    }

    return response;
  }

  async updateUser(userId: string, userData: Partial<AuthUser>): Promise<AuthUser> {
    console.log('[API] PUT User - Params:', { userId, table: this.table, userData });
    
    const token = await this.prefs.retrieveData<string>("token");
    if (!token) throw new Error("No token found");
    
    const projectId = process.env.EXPO_PUBLIC_ROBLE_PROJECT_ID;
    if (!projectId) throw new Error("Missing EXPO_PUBLIC_ROBLE_PROJECT_ID env var");
    
    const url = `${this.baseUrl}/${projectId}/update`;
    
    const response = await this.authorizedFetch(url, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        tableName: this.table,
        idColumn: "_id",
        idValue: userId,
        updates: userData,
      }),
    });

    if (response.status === 200 || response.status === 201) {
      console.log('[API] PUT User - Success');
      
      // Obtener el usuario actual desde AsyncStorage y actualizarlo
      const currentUser = await this.prefs.retrieveData<any>("user");
      const updatedUser = { ...currentUser, ...userData };
      
      // Actualizar el usuario en AsyncStorage
      await this.prefs.storeData("user", updatedUser);
      console.log('[API] PUT User - Result:', updatedUser);
      
      return updatedUser;
    } else {
      let errorBody;
      try {
        errorBody = await response.json();
      } catch (e) {
        errorBody = await response.text();
      }
      console.error('[API] PUT User - Error:', response.status, errorBody);
      throw new Error(`Error updating user: ${response.status}`);
    }
  }
}
