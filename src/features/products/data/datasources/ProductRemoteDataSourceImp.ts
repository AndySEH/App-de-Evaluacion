import { ILocalPreferences } from "@/src/core/iLocalPreferences";
import { LocalPreferencesAsyncStorage } from "@/src/core/LocalPreferencesAsyncStorage";
import { AuthRemoteDataSourceImpl } from "@/src/features/auth/data/datasources/AuthRemoteDataSourceImp";
import { NewProduct, Product } from "../../domain/entities/Product";
import { ProductDataSource } from "./ProductDataSource";

export class ProductRemoteDataSourceImp implements ProductDataSource {
  private readonly projectId: string;
  private readonly baseUrl: string;
  private readonly table = "Product";

  private prefs: ILocalPreferences;

  constructor(
    private authService: AuthRemoteDataSourceImpl,
    projectId = process.env.EXPO_PUBLIC_ROBLE_PROJECT_ID
  ) {
    if (!projectId) {
      throw new Error("Missing EXPO_PUBLIC_ROBLE_PROJECT_ID env var");
    }
    this.prefs = LocalPreferencesAsyncStorage.getInstance();
    this.projectId = projectId;
    this.baseUrl = `https://roble-api.openlab.uninorte.edu.co/database/${this.projectId}`;
  }

  private async authorizedFetch(
    url: string,
    options: RequestInit,
    retry = true
  ): Promise<Response> {
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
      console.warn("401 detected, checking refresh token availability...");
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
          if (!newToken) {
            throw new Error("Token refresh failed");
          }
          const retryHeaders = {
            ...(options.headers || {}),
            Authorization: `Bearer ${newToken}`,
          };
          return await fetch(url, { ...options, headers: retryHeaders });
        }
      } catch (e) {
        console.error("Authentication failed, clearing tokens", e);
        await this.prefs.removeData("token");
        await this.prefs.removeData("refreshToken");
        throw e;
      }
    }

    return response;
  }

  async getProducts(): Promise<Product[]> {
    const url = `${this.baseUrl}/read?tableName=${this.table}`;

    const response = await this.authorizedFetch(url, { method: "GET" });

    if (!response.ok) {
      if (response.status === 401) {
        throw new Error("Unauthorized (token issue)");
      }
      throw new Error(`Error fetching products: ${response.status}`);
    }

    const data = await response.json();

    // Here we assume the API returns a valid Product[]
    return data as Product[];
  }

  async getProductById(id: string): Promise<Product | undefined> {
    const url = `${this.baseUrl}/read?tableName=${this.table}&_id=${id}`;

    const response = await this.authorizedFetch(url, { method: "GET" });

    if (response.status === 200) {
      const data: Product[] = await response.json();
      return data.length > 0 ? data[0] : undefined;
    } else if (response.status === 401) {
      throw new Error("Unauthorized (token issue)");
    } else {
      const errorBody = await response.json().catch(() => ({}));
      throw new Error(
        `Error fetching product by id: ${response.status} - ${
          errorBody.message ?? "Unknown error"
        }`
      );
    }
  }
  async addProduct(product: NewProduct): Promise<void> {
    const url = `${this.baseUrl}/insert`;

    const body = JSON.stringify({
      tableName: this.table,
      records: [product], // 👈 the API expects an array of records
    });

    const response = await this.authorizedFetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body,
    });

    if (response.status === 201) {
      return Promise.resolve();
    } else if (response.status === 401) {
      throw new Error("Unauthorized (token issue)");
    } else {
      const errorBody = await response.json().catch(() => ({}));
      throw new Error(
        `Error adding product: ${response.status} - ${
          errorBody.message ?? "Unknown error"
        }`
      );
    }
  }

  async updateProduct(product: Product): Promise<void> {
    const url = `${this.baseUrl}/update`;

    const { _id, ...updates } = product; // 👈 separate id from fields

    const body = JSON.stringify({
      tableName: this.table,
      idColumn: "_id",
      idValue: _id,
      updates,
    });

    const response = await this.authorizedFetch(url, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body,
    });

    if (response.status === 200) {
      return Promise.resolve();
    } else if (response.status === 401) {
      throw new Error("Unauthorized (token issue)");
    } else {
      const errorBody = await response.json().catch(() => ({}));
      throw new Error(
        `Error updating product: ${response.status} - ${
          errorBody.message ?? "Unknown error"
        }`
      );
    }
  }

  async deleteProduct(id: string): Promise<void> {
    const url = `${this.baseUrl}/delete`;

    const body = JSON.stringify({
      tableName: this.table,
      idColumn: "_id",
      idValue: id,
    });

    const response = await this.authorizedFetch(url, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body,
    });

    if (response.status === 200) {
      return Promise.resolve();
    } else if (response.status === 401) {
      throw new Error("Unauthorized (token issue)");
    } else {
      const errorBody = await response.json().catch(() => ({}));
      throw new Error(
        `Error deleting product: ${response.status} - ${
          errorBody.message ?? "Unknown error"
        }`
      );
    }
  }
}
