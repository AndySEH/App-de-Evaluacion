import { ILocalPreferences } from "@/src/core/iLocalPreferences";
import { LocalPreferencesAsyncStorage } from "@/src/core/LocalPreferencesAsyncStorage";
import { AuthRemoteDataSourceImpl } from "@/src/features/auth/data/datasources/AuthRemoteDataSourceImp";
import { Course } from "../../../courses/domain/entities/Course";
import { CourseDataSource } from "./CourseDataSource";

export class CourseRemoteDataSourceImp implements CourseDataSource {
  private readonly projectId: string;
  private readonly baseUrl: string;
  private readonly table = "CourseModel";

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

    // Log request filters / info
    try {
      console.log("[CourseRemote] Request ->", { url, method: options.method || 'GET', headers: Object.keys(headers).includes('Authorization') ? 'Bearer ****' : headers });
    } catch (e) {
      // ignore logging errors
    }

    const response = await fetch(url, { ...options, headers });

    // Log response status
    try {
      console.log("[CourseRemote] Response status ->", { url, status: response.status });
    } catch (e) {
      // ignore
    }

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
          const retryResp = await fetch(url, { ...options, headers: retryHeaders });
          try {
            console.log("[CourseRemote] Retry response status ->", { url, status: retryResp.status });
          } catch {}
          return retryResp;
        }
      } catch (e) {
        await this.prefs.removeData("token");
        await this.prefs.removeData("refreshToken");
        throw e;
      }
    }

    // Try to log response body safely (use clone if available)
    try {
      // Some environments support response.clone(); wrap in try/catch
      if ((response as any).clone) {
        const cloned = (response as any).clone();
        cloned.text().then((txt: string) => {
          let parsed: any = txt;
          try {
            parsed = JSON.parse(txt);
          } catch {
            // leave as raw text
          }
          console.log("[CourseRemote] Response body ->", { url, body: parsed });
        }).catch(() => {});
      } else {
        // fallback: don't consume body
        console.log("[CourseRemote] Response body -> (streaming body, skipped)", { url });
      }
    } catch (e) {
      // ignore logging errors
    }

    return response;
  }

  async getCoursesByTeacher(teacherId: string): Promise<Course[]> {
    const url = `${this.baseUrl}/read?tableName=${this.table}&teacherId=${encodeURIComponent(teacherId)}`;

    const response = await this.authorizedFetch(url, { method: "GET" });

    if (!response.ok) {
      if (response.status === 401) throw new Error("Unauthorized (token issue)");
      throw new Error(`Error fetching courses: ${response.status}`);
    }

    const data = await response.json();
    return data as Course[];
  }

  async getCourseById(id: string): Promise<Course | undefined> {
    const url = `${this.baseUrl}/read?tableName=${this.table}&_id=${encodeURIComponent(id)}`;
    const response = await this.authorizedFetch(url, { method: "GET" });

    if (response.status === 200) {
      const data: Course[] = await response.json();
      return data.length > 0 ? data[0] : undefined;
    } else if (response.status === 401) {
      throw new Error("Unauthorized (token issue)");
    } else {
      const errorBody = await response.json().catch(() => ({}));
      throw new Error(`Error fetching course by id: ${response.status} - ${errorBody.message ?? "Unknown error"}`);
    }
  }

  async addCourse(course: Course): Promise<void> {
    const url = `${this.baseUrl}/insert`;

    const body = JSON.stringify({ tableName: this.table, records: [course] });

    const response = await this.authorizedFetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body,
    });

    if (response.status === 201) return Promise.resolve();
    if (response.status === 401) throw new Error("Unauthorized (token issue)");
    const errorBody = await response.json().catch(() => ({}));
    throw new Error(`Error adding course: ${response.status} - ${errorBody.message ?? "Unknown error"}`);
  }
}
