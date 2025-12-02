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
    // 1. PARÁMETROS DE LA SOLICITUD
    console.log('═══════════════════════════════════════════════');
    console.log('[API POST] CREAR GRUPO - PARÁMETROS:');
    console.log('Tabla:', this.table);
    console.log('Grupo recibido:', group);
    console.log('Tipo de memberIds:', typeof group.memberIds);
    console.log('Es array memberIds?:', Array.isArray(group.memberIds));
    console.log('memberIds valor:', group.memberIds);
    
    // Convertir memberIds a string JSON si es array
    const groupToSend = {
      ...group,
      memberIds: Array.isArray(group.memberIds) 
        ? JSON.stringify(group.memberIds) 
        : group.memberIds
    };
    
    console.log('Grupo a enviar (después de conversión):', groupToSend);
    console.log('memberIds después de conversión:', groupToSend.memberIds);
    console.log('Tipo de memberIds después:', typeof groupToSend.memberIds);
    console.log('═══════════════════════════════════════════════');
    
    const url = `${this.baseUrl}/insert`;
    const body = JSON.stringify({ tableName: this.table, records: [groupToSend] });

    const response = await this.authorizedFetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body,
    });

    // 2. ESTADO DE LA SOLICITUD
    console.log('═══════════════════════════════════════════════');
    console.log('[API POST] CREAR GRUPO - ESTADO DE LA SOLICITUD:');
    console.log('HTTP Status:', response.status);
    console.log('HTTP Status Text:', response.statusText);
    console.log('Content-Type:', response.headers.get('content-type'));
    console.log('═══════════════════════════════════════════════');
    
    const responseText = await response.text();
    
    // 3. JSON DE RESPUESTA
    console.log('═══════════════════════════════════════════════');
    console.log('[API POST] CREAR GRUPO - RESPUESTA JSON:');
    console.log('Respuesta completa:', responseText);
    try {
      const jsonResponse = JSON.parse(responseText);
      console.log('Respuesta parseada:', JSON.stringify(jsonResponse, null, 2));
    } catch (e) {
      console.log('No se pudo parsear como JSON, respuesta en texto plano');
    }
    console.log('═══════════════════════════════════════════════');

    if (response.status === 201) {
      console.log('[API] POST Add Group - Result: Success (201)');
      return Promise.resolve();
    }
    if (response.status === 200) {
      console.log('[API] POST Add Group - Result: Success (200)');
      return Promise.resolve();
    }
    if (response.status === 401) {
      console.error('[API] POST Add Group - Error:', response.status, 'Unauthorized');
      throw new Error("Unauthorized");
    }
    
    let errorBody;
    try {
      errorBody = JSON.parse(responseText);
    } catch (e) {
      errorBody = { message: responseText };
    }
    console.error('[API] POST Add Group - Error:', response.status, errorBody);
    throw new Error(`Error adding group: ${response.status} - ${errorBody.message ?? "Unknown error"}`);
  }

  async updateGroup(id: string, updates: Partial<Group>): Promise<void> {
    console.log('═══════════════════════════════════════════════');
    console.log('[API PUT] ACTUALIZAR GRUPO - DIAGNÓSTICO memberIds:');
    console.log('ID del grupo:', id);
    console.log('Updates recibidos:', updates);
    console.log('Tipo de memberIds:', typeof updates.memberIds);
    console.log('Es array memberIds?:', Array.isArray(updates.memberIds));
    console.log('memberIds valor:', updates.memberIds);
    console.log('memberIds JSON.stringify:', JSON.stringify(updates.memberIds));
    console.log('═══════════════════════════════════════════════');
    
    const url = `${this.baseUrl}/update`;
    const body = JSON.stringify({
      tableName: this.table,
      idColumn: "id",
      idValue: id,
      updates,
    });
    
    console.log('═══════════════════════════════════════════════');
    console.log('[API PUT] ACTUALIZAR GRUPO - REQUEST BODY:');
    console.log('Body completo:', body);
    console.log('Body parseado:', JSON.parse(body));
    console.log('═══════════════════════════════════════════════');

    const response = await this.authorizedFetch(url, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body,
    });

    console.log('[API] PUT Update Group - Response Status:', response.status);
    const responseData = await response.json().catch(() => ({}));
    console.log('[API] PUT Update Group - Response Data:', responseData);

    if (response.status === 200) {
      console.log('[API] PUT Update Group - Result: Success');
      return Promise.resolve();
    }
    if (response.status === 401) {
      console.error('[API] PUT Update Group - Error:', response.status, 'Unauthorized');
      throw new Error("Unauthorized");
    }
    console.error('[API] PUT Update Group - Error:', response.status, responseData);
    throw new Error(`Error updating group: ${response.status} - ${responseData.message ?? "Unknown error"}`);
  }

  async deleteGroup(id: string): Promise<void> {
    console.log('[API] DELETE Group - Params:', { id, table: this.table });
    const url = `${this.baseUrl}/delete`;
    const body = JSON.stringify({
      tableName: this.table,
      idColumn: "id",
      idValue: id,
    });
    console.log('[API] DELETE Group - Request URL:', url);
    console.log('[API] DELETE Group - Request Body:', body);
    
    const response = await this.authorizedFetch(url, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body,
    });

    console.log('[API] DELETE Group - Response Status:', response.status);
    const responseData = await response.json().catch(() => ({}));
    console.log('[API] DELETE Group - Response Data:', responseData);

    if (response.status === 200) {
      console.log('[API] DELETE Group - Result: Success');
      return Promise.resolve();
    }
    if (response.status === 401) {
      console.error('[API] DELETE Group - Error:', response.status, 'Unauthorized');
      throw new Error("Unauthorized");
    }
    console.error('[API] DELETE Group - Error:', response.status, responseData);
    throw new Error(`Error deleting group: ${response.status} - ${responseData.message ?? "Unknown error"}`);
  }
}
