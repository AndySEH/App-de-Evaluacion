import { ILocalPreferences } from "@/src/core/iLocalPreferences";
import { LocalPreferencesAsyncStorage } from "@/src/core/LocalPreferencesAsyncStorage";
import { AuthRemoteDataSourceImpl } from "@/src/features/auth/data/datasources/AuthRemoteDataSourceImp";
import { Group, NewGroup } from "../../domain/entities/Group";
import { GroupDataSource } from "./GroupDataSource";

export class GroupRemoteDataSourceImp implements GroupDataSource {
  private readonly projectId: string;
  private readonly baseUrl: string;
  private readonly table = "GroupModel";
  private prefs: ILocalPreferences;

  constructor(private authService: AuthRemoteDataSourceImpl, projectId = process.env.EXPO_PUBLIC_ROBLE_PROJECT_ID) {
    if (!projectId) {
      throw new Error("Missing EXPO_PUBLIC_ROBLE_PROJECT_ID env var");
    }
    this.prefs = LocalPreferencesAsyncStorage.getInstance();
    this.projectId = projectId;
    this.baseUrl = `https://roble-api.openlab.uninorte.edu.co/database/${this.projectId}`;
  }

  private async authorizedFetch(url: string, options: RequestInit, retry = true): Promise<Response> {
    const token = await this.prefs.retrieveData<string>("token");
    if (!token) {
      await this.prefs.removeData("token");
      await this.prefs.removeData("refreshToken");
      throw new Error("No authentication token available");
    }

    const headers = {
      ...(options.headers || {}),
      Authorization: `Bearer ${token}`,
    };

    const response = await fetch(url, { ...options, headers });

    if (response.status === 401 && retry) {
      try {
        const refreshToken = await this.prefs.retrieveData<string>("refreshToken");
        if (!refreshToken) {
          await this.prefs.removeData("token");
          await this.prefs.removeData("refreshToken");
          throw new Error("No refresh token available");
        }

        const refreshed = await this.authService.refreshToken();
        if (refreshed) {
          const newToken = await this.prefs.retrieveData<string>("token");
          if (!newToken) throw new Error("Token refresh failed");
          const retryHeaders = { ...(options.headers || {}), Authorization: `Bearer ${newToken}` };
          return await fetch(url, { ...options, headers: retryHeaders });
        }
      } catch (e) {
        await this.prefs.removeData("token");
        await this.prefs.removeData("refreshToken");
        throw e;
      }
    }

    return response;
  }

  async getGroupsByCategory(categoryId: string): Promise<Group[]> {
    console.log('[API] GET Groups by Category - Params:', { categoryId, table: this.table });
    const url = `${this.baseUrl}/read?tableName=${this.table}&categoryId=${encodeURIComponent(categoryId)}`;
    const response = await this.authorizedFetch(url, { method: "GET" });

    if (!response.ok) {
      const errorBody = await response.json().catch(() => ({}));
      console.error('[API] GET Groups by Category - Error:', response.status, errorBody);
      if (response.status === 401) throw new Error("Unauthorized");
      throw new Error(`Error fetching groups: ${response.status}`);
    }

    const data = await response.json();
    console.log('[API] GET Groups by Category - Result:', data);
    return data as Group[];
  }

  async getGroupById(id: string): Promise<Group | undefined> {
    console.log('[API] GET Group by ID - Params:', { id, table: this.table });
    const url = `${this.baseUrl}/read?tableName=${this.table}&id=${encodeURIComponent(id)}`;
    const response = await this.authorizedFetch(url, { method: "GET" });

    if (response.status === 200) {
      const data: Group[] = await response.json();
      const result = data.length > 0 ? data[0] : undefined;
      console.log('[API] GET Group by ID - Result:', result);
      return result;
    } else if (response.status === 401) {
      console.error('[API] GET Group by ID - Error:', response.status, 'Unauthorized');
      throw new Error("Unauthorized");
    } else {
      const errorBody = await response.json().catch(() => ({}));
      console.error('[API] GET Group by ID - Error:', response.status, errorBody);
      throw new Error(`Error fetching group: ${response.status} - ${errorBody.message ?? "Unknown error"}`);
    }
  }

  async addGroup(group: NewGroup): Promise<void> {
    console.log('[API] POST Add Group - Params:', { group, table: this.table });
    const url = `${this.baseUrl}/insert`;
    const body = JSON.stringify({ tableName: this.table, records: [group] });

    const response = await this.authorizedFetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body,
    });

    if (response.status === 201) {
      console.log('[API] POST Add Group - Result: Success');
      return Promise.resolve();
    }
    if (response.status === 401) {
      console.error('[API] POST Add Group - Error:', response.status, 'Unauthorized');
      throw new Error("Unauthorized");
    }
    const errorBody = await response.json().catch(() => ({}));
    console.error('[API] POST Add Group - Error:', response.status, errorBody);
    throw new Error(`Error adding group: ${response.status} - ${errorBody.message ?? "Unknown error"}`);
  }

  async updateGroup(id: string, updates: Partial<Group>): Promise<void> {
    console.log('[API] PUT Update Group - Params:', { id, updates, table: this.table });
    const url = `${this.baseUrl}/update`;
    const body = JSON.stringify({
      tableName: this.table,
      idColumn: "_id",
      idValue: id,
      updates,
    });

    const response = await this.authorizedFetch(url, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body,
    });

    if (response.status === 200) {
      console.log('[API] PUT Update Group - Result: Success');
      return Promise.resolve();
    }
    if (response.status === 401) {
      console.error('[API] PUT Update Group - Error:', response.status, 'Unauthorized');
      throw new Error("Unauthorized");
    }
    const errorBody = await response.json().catch(() => ({}));
    console.error('[API] PUT Update Group - Error:', response.status, errorBody);
    throw new Error(`Error updating group: ${response.status} - ${errorBody.message ?? "Unknown error"}`);
  }

  async deleteGroup(id: string): Promise<void> {
    console.log('[API] DELETE Group - Params:', { id, table: this.table });
    const url = `${this.baseUrl}/delete`;
    const response = await this.authorizedFetch(url, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        tableName: this.table,
        idColumn: "_id",
        idValue: id,
      }),
    });

    if (response.status === 200) {
      console.log('[API] DELETE Group - Result: Success');
      return Promise.resolve();
    }
    if (response.status === 401) {
      console.error('[API] DELETE Group - Error:', response.status, 'Unauthorized');
      throw new Error("Unauthorized");
    }
    const errorBody = await response.json().catch(() => ({}));
    console.error('[API] DELETE Group - Error:', response.status, errorBody);
    throw new Error(`Error deleting group: ${response.status} - ${errorBody.message ?? "Unknown error"}`);
  }
}
