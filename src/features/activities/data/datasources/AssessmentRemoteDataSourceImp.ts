import { ILocalPreferences } from "@/src/core/iLocalPreferences";
import { LocalPreferencesAsyncStorage } from "@/src/core/LocalPreferencesAsyncStorage";
import { AuthRemoteDataSourceImpl } from "@/src/features/auth/data/datasources/AuthRemoteDataSourceImp";
import { Assessment, NewAssessment } from "../../domain/entities/Assessment";
import { AssessmentDataSource } from "./AssessmentDataSource";

export class AssessmentRemoteDataSourceImp implements AssessmentDataSource {
  private readonly projectId: string;
  private readonly baseUrl: string;
  private readonly table = "AssessmentModel";
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

  async getAssessmentsByActivity(activityId: string): Promise<Assessment[]> {
    console.log('[API] GET Assessments by Activity - Params:', { activityId, table: this.table });
    const url = `${this.baseUrl}/read?tableName=${this.table}&activityId=${encodeURIComponent(activityId)}`;
    const response = await this.authorizedFetch(url, { method: "GET" });

    if (!response.ok) {
      const errorBody = await response.json().catch(() => ({}));
      console.error('[API] GET Assessments by Activity - Error:', response.status, errorBody);
      if (response.status === 401) throw new Error("Unauthorized");
      throw new Error(`Error fetching assessments: ${response.status}`);
    }

    const data = await response.json();
    console.log('[API] GET Assessments by Activity - Result:', data);
    return data as Assessment[];
  }

  async getAssessmentById(id: string): Promise<Assessment | undefined> {
    console.log('[API] GET Assessment by ID - Params:', { id, table: this.table });
    const url = `${this.baseUrl}/read?tableName=${this.table}&id=${encodeURIComponent(id)}`;
    const response = await this.authorizedFetch(url, { method: "GET" });

    if (response.status === 200) {
      const data: Assessment[] = await response.json();
      const result = data.length > 0 ? data[0] : undefined;
      console.log('[API] GET Assessment by ID - Result:', result);
      return result;
    } else if (response.status === 401) {
      console.error('[API] GET Assessment by ID - Error:', response.status, 'Unauthorized');
      throw new Error("Unauthorized");
    } else {
      const errorBody = await response.json().catch(() => ({}));
      console.error('[API] GET Assessment by ID - Error:', response.status, errorBody);
      throw new Error(`Error fetching assessment: ${response.status} - ${errorBody.message ?? "Unknown error"}`);
    }
  }

  async addAssessment(assessment: NewAssessment): Promise<void> {
    console.log('[API] POST Add Assessment - Params:', { assessment, table: this.table });
    const url = `${this.baseUrl}/insert`;
    const body = JSON.stringify({ tableName: this.table, records: [assessment] });

    const response = await this.authorizedFetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body,
    });

    if (response.status === 201) {
      console.log('[API] POST Add Assessment - Result: Success');
      return Promise.resolve();
    }
    if (response.status === 401) {
      console.error('[API] POST Add Assessment - Error:', response.status, 'Unauthorized');
      throw new Error("Unauthorized");
    }
    const errorBody = await response.json().catch(() => ({}));
    console.error('[API] POST Add Assessment - Error:', response.status, errorBody);
    throw new Error(`Error adding assessment: ${response.status} - ${errorBody.message ?? "Unknown error"}`);
  }

  async updateAssessment(id: string, updates: Partial<Assessment>): Promise<void> {
    console.log('[API] PUT Update Assessment - Params:', { id, updates, table: this.table });
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
      console.log('[API] PUT Update Assessment - Result: Success');
      return Promise.resolve();
    }
    if (response.status === 401) {
      console.error('[API] PUT Update Assessment - Error:', response.status, 'Unauthorized');
      throw new Error("Unauthorized");
    }
    const errorBody = await response.json().catch(() => ({}));
    console.error('[API] PUT Update Assessment - Error:', response.status, errorBody);
    throw new Error(`Error updating assessment: ${response.status} - ${errorBody.message ?? "Unknown error"}`);
  }

  async deleteAssessment(id: string): Promise<void> {
    console.log('[API] DELETE Assessment - Params:', { id, table: this.table });
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

    if (response.status === 200) {
      console.log('[API] DELETE Assessment - Result: Success');
      return Promise.resolve();
    }
    if (response.status === 401) {
      console.error('[API] DELETE Assessment - Error:', response.status, 'Unauthorized');
      throw new Error("Unauthorized");
    }
    const errorBody = await response.json().catch(() => ({}));
    console.error('[API] DELETE Assessment - Error:', response.status, errorBody);
    throw new Error(`Error deleting assessment: ${response.status} - ${errorBody.message ?? "Unknown error"}`);
  }
}
