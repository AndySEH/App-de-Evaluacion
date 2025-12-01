import { ILocalPreferences } from "@/src/core/iLocalPreferences";
import { LocalPreferencesAsyncStorage } from "@/src/core/LocalPreferencesAsyncStorage";
import { AuthRemoteDataSourceImpl } from "@/src/features/auth/data/datasources/AuthRemoteDataSourceImp";
import { Category, NewCategory } from "../../domain/entities/Category";
import { CategoryDataSource } from "./CategoryDataSource";

export class CategoryRemoteDataSourceImp implements CategoryDataSource {
  private readonly projectId: string;
  private readonly baseUrl: string;
  private readonly table = "CategoryModel";
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

  async getCategoriesByCourse(courseId: string): Promise<Category[]> {
    const url = `${this.baseUrl}/read?tableName=${this.table}&courseId=${encodeURIComponent(courseId)}`;
    const response = await this.authorizedFetch(url, { method: "GET" });

    if (!response.ok) {
      if (response.status === 401) throw new Error("Unauthorized");
      throw new Error(`Error fetching categories: ${response.status}`);
    }

    const data = await response.json();
    return data as Category[];
  }

  async getCategoryById(id: string): Promise<Category | undefined> {
    const url = `${this.baseUrl}/read?tableName=${this.table}&_id=${encodeURIComponent(id)}`;
    const response = await this.authorizedFetch(url, { method: "GET" });

    if (response.status === 200) {
      const data: Category[] = await response.json();
      return data.length > 0 ? data[0] : undefined;
    } else if (response.status === 401) {
      throw new Error("Unauthorized");
    } else {
      const errorBody = await response.json().catch(() => ({}));
      throw new Error(`Error fetching category: ${response.status} - ${errorBody.message ?? "Unknown error"}`);
    }
  }

  async addCategory(category: NewCategory): Promise<void> {
    const url = `${this.baseUrl}/insert`;
    const body = JSON.stringify({ tableName: this.table, records: [category] });

    const response = await this.authorizedFetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body,
    });

    if (response.status === 201) return Promise.resolve();
    if (response.status === 401) throw new Error("Unauthorized");
    const errorBody = await response.json().catch(() => ({}));
    throw new Error(`Error adding category: ${response.status} - ${errorBody.message ?? "Unknown error"}`);
  }

  async updateCategory(id: string, updates: Partial<Category>): Promise<void> {
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

    if (response.status === 200) return Promise.resolve();
    if (response.status === 401) throw new Error("Unauthorized");
    const errorBody = await response.json().catch(() => ({}));
    throw new Error(`Error updating category: ${response.status} - ${errorBody.message ?? "Unknown error"}`);
  }

  async deleteCategory(id: string): Promise<void> {
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

    if (response.status === 200) return Promise.resolve();
    if (response.status === 401) throw new Error("Unauthorized");
    const errorBody = await response.json().catch(() => ({}));
    throw new Error(`Error deleting category: ${response.status} - ${errorBody.message ?? "Unknown error"}`);
  }
}
