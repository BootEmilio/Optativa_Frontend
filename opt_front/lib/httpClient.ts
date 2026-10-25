import { API_BASE_URL } from '@/config/endpoints';

export class ApiError extends Error {
  status: number;
  body: unknown;

  constructor(message: string, status: number, body?: unknown) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.body = body;
  }
}

type QueryValue = string | number | boolean | undefined | null;

export interface HttpRequestOptions extends Omit<RequestInit, 'body'> {
  query?: Record<string, QueryValue>;
  body?: unknown;
  timeoutMs?: number;
}

const TOKEN_STORAGE_KEY = 'utm_desk_token';
const DEFAULT_TIMEOUT_MS = 60_000; // 60s: el backend en Render duerme y puede tardar en despertar

function buildUrl(path: string, query?: Record<string, QueryValue>): string {
  const url = new URL(path.startsWith('http') ? path : `${API_BASE_URL}${path}`);
  if (query) {
    for (const [key, value] of Object.entries(query)) {
      if (value === undefined || value === null || value === '') continue;
      url.searchParams.set(key, String(value));
    }
  }
  return url.toString();
}

function authHeaders(): HeadersInit {
  if (typeof window === 'undefined') return {};
  const token = window.localStorage.getItem(TOKEN_STORAGE_KEY);
  return token ? { Authorization: `Bearer ${token}` } : {};
}

function messageFromBody(body: unknown, fallback: string): string {
  if (!body || typeof body !== 'object') return fallback;
  const record = body as Record<string, unknown>;
  if (typeof record.message === 'string' && record.message.trim()) {
    return record.message;
  }
  if (typeof record.error === 'string' && record.error.trim()) {
    return record.error;
  }
  return fallback;
}

async function parseBody(response: Response): Promise<unknown> {
  const text = await response.text();
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

export async function httpClient<T>(
  path: string,
  options: HttpRequestOptions = {}
): Promise<T> {
  const {
    query,
    body,
    headers,
    timeoutMs = DEFAULT_TIMEOUT_MS,
    signal: userSignal,
    ...rest
  } = options;
  const url = buildUrl(path, query);

  const controller = new AbortController();
  let timedOut = false;
  const timer = setTimeout(() => {
    timedOut = true;
    controller.abort();
  }, timeoutMs);

  if (userSignal) {
    if (userSignal.aborted) {
      controller.abort();
    } else {
      userSignal.addEventListener('abort', () => controller.abort(), { once: true });
    }
  }

  try {
    const response = await fetch(url, {
      ...rest,
      signal: controller.signal,
      credentials: 'include',
      headers: {
        Accept: 'application/json',
        ...(body !== undefined ? { 'Content-Type': 'application/json' } : {}),
        ...authHeaders(),
        ...headers,
      },
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });

    const parsed = await parseBody(response);

    if (!response.ok) {
      throw new ApiError(
        messageFromBody(parsed, `Error ${response.status} al llamar ${path}`),
        response.status,
        parsed
      );
    }

    return parsed as T;
  } catch (error) {
    if (timedOut) {
      throw new ApiError(
        `Tiempo de espera agotado (${Math.round(timeoutMs / 1000)}s) al llamar ${path}. El backend en Render puede estar iniciando. Por favor, reintenta en unos momentos.`,
        408
      );
    }
    throw error;
  } finally {
    clearTimeout(timer);
  }
}
