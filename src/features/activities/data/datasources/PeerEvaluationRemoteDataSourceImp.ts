import { ILocalPreferences } from "@/src/core/iLocalPreferences";
import { LocalPreferencesAsyncStorage } from "@/src/core/LocalPreferencesAsyncStorage";
import { AuthRemoteDataSourceImpl } from "@/src/features/auth/data/datasources/AuthRemoteDataSourceImp";
import { NewPeerEvaluation, PeerEvaluation } from "../../domain/entities/PeerEvaluation";
import { PeerEvaluationDataSource } from "./PeerEvaluationDataSource";

export class PeerEvaluationRemoteDataSourceImp implements PeerEvaluationDataSource {
  private readonly projectId: string;
  private readonly baseUrl: string;
  private readonly table = "PeerEvaluationModel";
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

  async getPeerEvaluationsByAssessment(assessmentId: string): Promise<PeerEvaluation[]> {
    console.log('[API] GET Peer Evaluations by Assessment - Params:', { assessmentId, table: this.table });
    const url = `${this.baseUrl}/read?tableName=${this.table}&assessmentId=${encodeURIComponent(assessmentId)}`;
    const response = await this.authorizedFetch(url, { method: "GET" });

    if (!response.ok) {
      const errorBody = await response.json().catch(() => ({}));
      console.error('[API] GET Peer Evaluations by Assessment - Error:', response.status, errorBody);
      if (response.status === 401) throw new Error("Unauthorized");
      throw new Error(`Error fetching peer evaluations: ${response.status}`);
    }

    const data = await response.json();
    console.log('[API] GET Peer Evaluations by Assessment - Result:', data);
    return data as PeerEvaluation[];
  }

  async getPeerEvaluationById(id: string): Promise<PeerEvaluation | undefined> {
    console.log('[API] GET PeerEvaluation by ID - Params:', { id, table: this.table });
    const url = `${this.baseUrl}/read?tableName=${this.table}&id=${encodeURIComponent(id)}`;
    const response = await this.authorizedFetch(url, { method: "GET" });

    if (response.status === 200) {
      const data: PeerEvaluation[] = await response.json();
      const result = data.length > 0 ? data[0] : undefined;
      console.log('[API] GET Peer Evaluation by ID - Result:', result);
      return result;
    } else if (response.status === 401) {
      console.error('[API] GET Peer Evaluation by ID - Error:', response.status, 'Unauthorized');
      throw new Error("Unauthorized");
    } else {
      const errorBody = await response.json().catch(() => ({}));
      console.error('[API] GET Peer Evaluation by ID - Error:', response.status, errorBody);
      throw new Error(`Error fetching peer evaluation: ${response.status} - ${errorBody.message ?? "Unknown error"}`);
    }
  }

  async addPeerEvaluation(peerEvaluation: NewPeerEvaluation): Promise<void> {
    console.log('[API] POST Add Peer Evaluation - Params:', { peerEvaluation, table: this.table });
    const url = `${this.baseUrl}/insert`;
    const body = JSON.stringify({ tableName: this.table, records: [peerEvaluation] });

    const response = await this.authorizedFetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body,
    });

    if (response.status === 201) {
      console.log('[API] POST Add Peer Evaluation - Result: Success');
      return Promise.resolve();
    }
    if (response.status === 401) {
      console.error('[API] POST Add Peer Evaluation - Error:', response.status, 'Unauthorized');
      throw new Error("Unauthorized");
    }
    const errorBody = await response.json().catch(() => ({}));
    console.error('[API] POST Add Peer Evaluation - Error:', response.status, errorBody);
    throw new Error(`Error adding peer evaluation: ${response.status} - ${errorBody.message ?? "Unknown error"}`);
  }

  async updatePeerEvaluation(id: string, updates: Partial<PeerEvaluation>): Promise<void> {
    console.log('[API] PUT Update Peer Evaluation - Params:', { id, updates, table: this.table });
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
      console.log('[API] PUT Update Peer Evaluation - Result: Success');
      return Promise.resolve();
    }
    if (response.status === 401) {
      console.error('[API] PUT Update Peer Evaluation - Error:', response.status, 'Unauthorized');
      throw new Error("Unauthorized");
    }
    const errorBody = await response.json().catch(() => ({}));
    console.error('[API] PUT Update Peer Evaluation - Error:', response.status, errorBody);
    throw new Error(`Error updating peer evaluation: ${response.status} - ${errorBody.message ?? "Unknown error"}`);
  }

  async deletePeerEvaluation(id: string): Promise<void> {
    console.log('[API] DELETE Peer Evaluation - Params:', { id, table: this.table });
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
      console.log('[API] DELETE Peer Evaluation - Result: Success');
      return Promise.resolve();
    }
    if (response.status === 401) {
      console.error('[API] DELETE Peer Evaluation - Error:', response.status, 'Unauthorized');
      throw new Error("Unauthorized");
    }
    const errorBody = await response.json().catch(() => ({}));
    console.error('[API] DELETE Peer Evaluation - Error:', response.status, errorBody);
    throw new Error(`Error deleting peer evaluation: ${response.status} - ${errorBody.message ?? "Unknown error"}`);
  }
}
