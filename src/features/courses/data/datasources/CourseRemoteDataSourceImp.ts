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
        console.log("[CourseRemote] Token expired, attempting refresh...");
        const refreshToken = await this.prefs.retrieveData<string>("refreshToken");
        if (!refreshToken) {
          console.error("[CourseRemote] No refresh token available");
          await this.prefs.removeData("token");
          await this.prefs.removeData("refreshToken");
          throw new Error("No refresh token available");
        }

        const refreshed = await this.authService.refreshToken();
        console.log("[CourseRemote] Token refresh result:", refreshed);
        
        if (refreshed) {
          const newToken = await this.prefs.retrieveData<string>("token");
          if (!newToken) {
            console.error("[CourseRemote] Token refresh succeeded but no new token found");
            throw new Error("Token refresh failed");
          }
          console.log("[CourseRemote] Retrying request with new token...");
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
    console.log('[API] GET Courses by Teacher - Params:', { teacherId, table: this.table });
    const url = `${this.baseUrl}/read?tableName=${this.table}&teacherId=${encodeURIComponent(teacherId)}`;

    const response = await this.authorizedFetch(url, { method: "GET" });

    if (!response.ok) {
      const errorBody = await response.json().catch(() => ({}));
      console.error('[API] GET Courses by Teacher - Error:', response.status, errorBody);
      if (response.status === 401) throw new Error("Unauthorized (token issue)");
      throw new Error(`Error fetching courses: ${response.status}`);
    }

    const data = await response.json();
    console.log('[API] GET Courses by Teacher - Result:', data);
    return data as Course[];
  }

  async getCoursesByStudent(studentId: string): Promise<Course[]> {
    console.log('[API] GET Courses by Student - Params:', { studentId, table: this.table });
    const url = `${this.baseUrl}/read?tableName=${this.table}`;
    
    const response = await this.authorizedFetch(url, { method: "GET" });

    if (!response.ok) {
      const errorBody = await response.json().catch(() => ({}));
      console.error('[API] GET Courses by Student - Error:', response.status, errorBody);
      if (response.status === 401) throw new Error("Unauthorized (token issue)");
      throw new Error(`Error fetching courses: ${response.status}`);
    }

    const allCourses = await response.json() as Course[];
    console.log('[API] GET Courses - Sample course structure:', allCourses[0]);
    
    // Filtrar cursos donde el studentId esté en el array studentIds
    const studentCourses = allCourses.filter(course => {
      // Convertir studentIds a array si es string
      let studentIdsArray: string[] = [];
      
      if (Array.isArray(course.studentIds)) {
        studentIdsArray = course.studentIds;
      } else if (typeof course.studentIds === 'string') {
        // Si es string, intentar parsearlo como JSON
        try {
          studentIdsArray = JSON.parse(course.studentIds);
        } catch (e) {
          // Si no es JSON válido, podría ser un string separado por comas
          studentIdsArray = (course.studentIds as string).split(',').map((id: string) => id.trim());
        }
      } else if (course.studentIds && typeof course.studentIds === 'object') {
        // Si es un objeto, obtener los valores
        studentIdsArray = Object.values(course.studentIds);
      }
      
      return studentIdsArray.includes(studentId);
    });
    console.log('[API] GET Courses by Student - Result:', studentCourses);
    return studentCourses;
  }

  async getCourseById(id: string): Promise<Course | undefined> {
    console.log('[API] GET Course by ID - Params:', { id, table: this.table });
    const url = `${this.baseUrl}/read?tableName=${this.table}&id=${encodeURIComponent(id)}`;
    const response = await this.authorizedFetch(url, { method: "GET" });

    if (response.status === 200) {
      const data: Course[] = await response.json();
      const result = data.length > 0 ? data[0] : undefined;
      console.log('[API] GET Course by ID - Result:', result);
      return result;
    } else if (response.status === 401) {
      console.error('[API] GET Course by ID - Error:', response.status, 'Unauthorized');
      throw new Error("Unauthorized (token issue)");
    } else {
      const errorBody = await response.json().catch(() => ({}));
      console.error('[API] GET Course by ID - Error:', response.status, errorBody);
      throw new Error(`Error fetching course by id: ${response.status} - ${errorBody.message ?? "Unknown error"}`);
    }
  }

  async addCourse(course: Course): Promise<void> {
    console.log('[API] POST Add Course - Params:', { course, table: this.table });
    
    // Verificar que tenemos un token antes de intentar
    const token = await this.prefs.retrieveData<string>("token");
    console.log('[API] POST Add Course - Token exists:', !!token);
    
    const url = `${this.baseUrl}/insert`;

    // Generar un ID único si no existe y asegurar que studentIds e invitations sean arrays
    const courseWithId = {
      ...course,
      id: course.id || `course_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      studentIds: Array.isArray(course.studentIds) ? course.studentIds : [],
      invitations: Array.isArray(course.invitations) ? course.invitations : [],
    };

    const body = JSON.stringify({ tableName: this.table, records: [courseWithId] });
    console.log('[API] POST Add Course - Course with ID:', courseWithId);
    console.log('[API] POST Add Course - Body:', body);

    const response = await this.authorizedFetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body,
    });

    if (response.status === 201) {
      console.log('[API] POST Add Course - Result: Success');
      return Promise.resolve();
    }
    
    const errorBody = await response.json().catch(() => ({}));
    console.error('[API] POST Add Course - Error:', response.status, errorBody);
    
    if (response.status === 401) {
      throw new Error("Unauthorized - Please login again");
    }
    
    throw new Error(`Error adding course: ${response.status} - ${errorBody.message ?? "Unknown error"}`);
  }
}
