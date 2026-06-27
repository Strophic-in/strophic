import type { ApiResponse, ApiSuccess, Pagination, Role } from "@strophic/types";
import type {
  ChangePasswordInput,
  ContactInput,
  ForgotPasswordInput,
  LoginInput,
  NewsletterSubscribeInput,
  NewsletterUnsubscribeInput,
  ResetPasswordInput,
} from "@strophic/validation";

/** Error thrown when the API returns a non-ok envelope or an unreadable response. */
export class ApiError extends Error {
  constructor(
    readonly code: string,
    message: string,
    readonly status: number,
    readonly details?: unknown,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

export interface SessionUser {
  id: string;
  email: string;
  name: string;
  role: Role;
}

export interface ApiClientOptions {
  baseUrl: string;
  /** Inject a custom fetch (tests/SSR). Defaults to global fetch. */
  fetch?: typeof fetch;
  /** Optional bearer token for non-cookie contexts (cookies are used by default). */
  getAccessToken?: () => string | undefined;
}

export class ApiClient {
  private readonly baseUrl: string;

  constructor(private readonly options: ApiClientOptions) {
    this.baseUrl = options.baseUrl.replace(/\/+$/, "");
  }

  private async requestEnvelope<T>(path: string, init: RequestInit = {}): Promise<ApiSuccess<T>> {
    const doFetch = this.options.fetch ?? fetch;
    const headers = new Headers(init.headers);
    if (init.body && !headers.has("Content-Type")) {
      headers.set("Content-Type", "application/json");
    }
    const token = this.options.getAccessToken?.();
    if (token) headers.set("Authorization", `Bearer ${token}`);

    const response = await doFetch(`${this.baseUrl}${path}`, {
      ...init,
      headers,
      credentials: "include",
    });

    const json = (await response.json().catch(() => null)) as ApiResponse<T> | null;
    if (!json) {
      throw new ApiError("NETWORK_ERROR", "Unreadable response from the API", response.status);
    }
    if (!json.ok) {
      throw new ApiError(json.error.code, json.error.message, response.status, json.error.details);
    }
    return json;
  }

  private async request<T>(path: string, init: RequestInit = {}): Promise<T> {
    return (await this.requestEnvelope<T>(path, init)).data;
  }

  /** GET a paginated list endpoint, returning items + pagination from the envelope's meta. */
  async getPaginated<T>(path: string): Promise<{ items: T[]; pagination: Pagination }> {
    const env = await this.requestEnvelope<{ items: T[] }>(path);
    const fallback: Pagination = {
      page: 1,
      pageSize: env.data.items.length,
      total: env.data.items.length,
      totalPages: 1,
    };
    return {
      items: env.data.items,
      pagination: (env.meta?.pagination as Pagination | undefined) ?? fallback,
    };
  }

  // ── Generic verbs (used by feature methods in later phases) ──
  get<T>(path: string) {
    return this.request<T>(path);
  }
  post<T>(path: string, body?: unknown) {
    return this.request<T>(path, { method: "POST", body: body ? JSON.stringify(body) : undefined });
  }
  put<T>(path: string, body?: unknown) {
    return this.request<T>(path, { method: "PUT", body: body ? JSON.stringify(body) : undefined });
  }
  patch<T>(path: string, body?: unknown) {
    return this.request<T>(path, { method: "PATCH", body: body ? JSON.stringify(body) : undefined });
  }
  delete<T>(path: string) {
    return this.request<T>(path, { method: "DELETE" });
  }

  // ── Auth ──
  health() {
    return this.get<{ status: string; service: string }>("/health");
  }
  login(input: LoginInput) {
    return this.post<{ user: SessionUser }>("/api/v1/auth/login", input);
  }
  refresh() {
    return this.post<{ user: SessionUser }>("/api/v1/auth/refresh");
  }
  logout() {
    return this.post<{ success: boolean }>("/api/v1/auth/logout");
  }
  me() {
    return this.get<{ user: SessionUser }>("/api/v1/auth/me");
  }
  forgotPassword(input: ForgotPasswordInput) {
    return this.post<{ success: boolean }>("/api/v1/auth/forgot-password", input);
  }
  resetPassword(input: ResetPasswordInput) {
    return this.post<{ success: boolean }>("/api/v1/auth/reset-password", input);
  }
  changePassword(input: ChangePasswordInput) {
    return this.post<{ success: boolean }>("/api/v1/auth/change-password", input);
  }

  // ── Lead engine (public) ──
  submitContact(input: ContactInput) {
    return this.post<{ success: boolean; id?: string }>("/api/v1/contact", input);
  }
  subscribeNewsletter(input: NewsletterSubscribeInput) {
    return this.post<{ success: boolean }>("/api/v1/newsletter/subscribe", input);
  }
  unsubscribeNewsletter(input: NewsletterUnsubscribeInput) {
    return this.post<{ success: boolean }>("/api/v1/newsletter/unsubscribe", input);
  }
}

export function createApiClient(options: ApiClientOptions): ApiClient {
  return new ApiClient(options);
}
