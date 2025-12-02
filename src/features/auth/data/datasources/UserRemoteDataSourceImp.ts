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

  async getUserById(userId: string): Promise<AuthUser | null> {
    console.log('[API] GET User by ID - Params:', { userId, table: this.table });
    
    const projectId = process.env.EXPO_PUBLIC_ROBLE_PROJECT_ID;
    if (!projectId) throw new Error("Missing EXPO_PUBLIC_ROBLE_PROJECT_ID env var");
    
    const url = `${this.baseUrl}/${projectId}/read?tableName=${this.table}&userId=${userId}`;
    console.log('[API] GET User by ID - Request URL:', url);
    
    const response = await this.authorizedFetch(url, {
      method: "GET",
      headers: { "Content-Type": "application/json" },
    });

    console.log('[API] GET User by ID - Response Status:', response.status);
    
    if (response.status === 200) {
      const data = await response.json();
      console.log('[API] GET User by ID - Result:', data);
      
      if (data && data.length > 0) {
        return data[0] as AuthUser;
      }
      return null;
    } else {
      const errorBody = await response.json().catch(() => ({}));
      console.error('[API] GET User by ID - Error:', response.status, errorBody);
      console.error('[API] GET User by ID - Failed URL:', url);
      return null;
    }
  }

  async getUsersByIds(userIds: string[]): Promise<AuthUser[]> {
    console.log('[API] GET Users by IDs - Params:', { userIds, count: userIds.length, table: this.table });
    console.log('[API] GET Users by IDs - Individual IDs:', userIds);
    
    if (userIds.length === 0) {
      console.log('[API] GET Users by IDs - Empty array, returning []');
      return [];
    }

    const projectId = process.env.EXPO_PUBLIC_ROBLE_PROJECT_ID;
    if (!projectId) throw new Error("Missing EXPO_PUBLIC_ROBLE_PROJECT_ID env var");

    // Obtener todos los usuarios haciendo múltiples peticiones
    const users: AuthUser[] = [];
    
    for (const userId of userIds) {
      console.log('[API] GET Users by IDs - Fetching user:', userId);
      try {
        const user = await this.getUserById(userId);
        if (user) {
          console.log('[API] GET Users by IDs - User found:', user.name || user.email);
          users.push(user);
        } else {
          console.warn('[API] GET Users by IDs - User not found for ID:', userId);
        }
      } catch (error) {
        console.error(`[API] GET Users by IDs - Error fetching user ${userId}:`, error);
      }
    }

    console.log('[API] GET Users by IDs - Result:', users.length, 'users found out of', userIds.length, 'requested');
    return users;
  }
}
