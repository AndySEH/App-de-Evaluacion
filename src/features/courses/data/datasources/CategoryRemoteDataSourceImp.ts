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
    console.log('[API] GET Categories by Course - Params:', { courseId, table: this.table });
    const url = `${this.baseUrl}/read?tableName=${this.table}&courseId=${encodeURIComponent(courseId)}`;
    const response = await this.authorizedFetch(url, { method: "GET" });

    if (!response.ok) {
      const errorBody = await response.json().catch(() => ({}));
      console.error('[API] GET Categories by Course - Error:', response.status, errorBody);
      if (response.status === 401) throw new Error("Unauthorized");
      throw new Error(`Error fetching categories: ${response.status}`);
    }

    const data = await response.json();
    console.log('[API] GET Categories by Course - Result:', data);
    return data as Category[];
  }

  async getCategoryById(id: string): Promise<Category | undefined> {
    console.log('[API] GET Category by ID - Params:', { id, table: this.table });
    const url = `${this.baseUrl}/read?tableName=${this.table}&id=${encodeURIComponent(id)}`;
    const response = await this.authorizedFetch(url, { method: "GET" });

    if (response.status === 200) {
      const data: Category[] = await response.json();
      const result = data.length > 0 ? data[0] : undefined;
      console.log('[API] GET Category by ID - Result:', result);
      return result;
    } else if (response.status === 401) {
      console.error('[API] GET Category by ID - Error:', response.status, 'Unauthorized');
      throw new Error("Unauthorized");
    } else {
      const errorBody = await response.json().catch(() => ({}));
      console.error('[API] GET Category by ID - Error:', response.status, errorBody);
      throw new Error(`Error fetching category: ${response.status} - ${errorBody.message ?? "Unknown error"}`);
    }
  }

  async addCategory(category: NewCategory): Promise<void> {
    console.log('[API] POST Add Category - Params:', { category, table: this.table });
    
    // Mapear randomGroups a random para la API
    const apiCategory: any = { ...category };
    if ('randomGroups' in category) {
      apiCategory.random = category.randomGroups;
      delete apiCategory.randomGroups;
    }
    
    const url = `${this.baseUrl}/insert`;
    const body = JSON.stringify({ tableName: this.table, records: [apiCategory] });
    console.log('[API] POST Add Category - Request URL:', url);
    console.log('[API] POST Add Category - Request Body:', body);

    const response = await this.authorizedFetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body,
    });

    console.log('[API] POST Add Category - Response Status:', response.status);
    const responseData = await response.json().catch(() => ({}));
    console.log('[API] POST Add Category - Response Data:', responseData);

    if (response.status === 201) {
      console.log('[API] POST Add Category - Result: Success');
      return Promise.resolve();
    }
    if (response.status === 401) {
      console.error('[API] POST Add Category - Error:', response.status, 'Unauthorized');
      throw new Error("Unauthorized");
    }
    console.error('[API] POST Add Category - Error:', response.status, responseData);
    throw new Error(`Error adding category: ${response.status} - ${responseData.message ?? "Unknown error"}`);
  }

  async updateCategory(id: string, updates: Partial<Category>): Promise<void> {
    console.log('[API] PUT Update Category - Params:', { id, updates, table: this.table });
    const url = `${this.baseUrl}/update`;
    const body = JSON.stringify({
      tableName: this.table,
      idColumn: "id",
      idValue: id,
      updates,
    });

    const response = await this.authorizedFetch(url, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body,
    });

    if (response.status === 200) {
      console.log('[API] PUT Update Category - Result: Success');
      return Promise.resolve();
    }
    if (response.status === 401) {
      console.error('[API] PUT Update Category - Error:', response.status, 'Unauthorized');
      throw new Error("Unauthorized");
    }
    const errorBody = await response.json().catch(() => ({}));
    console.error('[API] PUT Update Category - Error:', response.status, errorBody);
    throw new Error(`Error updating category: ${response.status} - ${errorBody.message ?? "Unknown error"}`);
  }

  async deleteCategory(id: string): Promise<void> {
    console.log('[API] DELETE Category - Params:', { id, table: this.table });
    const url = `${this.baseUrl}/delete`;
    const response = await this.authorizedFetch(url, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        tableName: this.table,
        idColumn: "id",
        idValue: id,
      }),
    });

    console.log('[API] DELETE Category - ID:', id);

    if (response.status === 200) {
      console.log('[API] DELETE Category - Result: Success');
      return Promise.resolve();
    }
    if (response.status === 401) {
      console.error('[API] DELETE Category - Error:', response.status, 'Unauthorized');
      throw new Error("Unauthorized");
    }
    const errorBody = await response.json().catch(() => ({}));
    console.error('[API] DELETE Category - Error:', response.status, errorBody);
    throw new Error(`Error deleting category: ${response.status} - ${errorBody.message ?? "Unknown error"}`);
  }
}
