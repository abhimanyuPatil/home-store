import type {
  AffectedAssignment,
  BackupInventoryItem,
  InventoryItem,
  Location,
  Supply,
} from './types';

const apiBaseUrl = (
  import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:3000/api/v1'
).replace(/\/$/, '');

export type ApiErrorShape = {
  code: string;
  message: string;
  details?: { affectedAssignments?: AffectedAssignment[] };
};

export class ApiError extends Error {
  public constructor(
    public readonly status: number,
    public readonly error: ApiErrorShape,
  ) {
    super(error.message);
    this.name = 'ApiError';
  }
}

const parseResponse = async <T>(response: Response): Promise<T> => {
  if (response.status === 204) return undefined as T;
  const body = (await response.json().catch(() => ({}))) as {
    error?: ApiErrorShape;
  } & T;
  if (!response.ok) {
    throw new ApiError(
      response.status,
      body.error ?? { code: 'UNKNOWN_ERROR', message: 'The request failed.' },
    );
  }
  return body;
};

export const createApiClient = (
  getToken: () => string | null,
  onUnauthorized: () => void,
) => {
  const request = async <T>(
    path: string,
    options: RequestInit = {},
  ): Promise<T> => {
    const token = getToken();
    const headers = new Headers(options.headers);
    headers.set('Content-Type', 'application/json');
    if (token) headers.set('Authorization', `Bearer ${token}`);
    const response = await fetch(`${apiBaseUrl}${path}`, {
      ...options,
      headers,
    });
    if (response.status === 401) onUnauthorized();
    return parseResponse<T>(response);
  };

  const json = <T>(path: string, method: string, body?: unknown) =>
    request<T>(path, {
      method,
      body: body === undefined ? undefined : JSON.stringify(body),
    });

  return {
    createSession: async (pin: string) =>
      request<{ token: string; expiresAt: string }>('/session', {
        method: 'POST',
        body: JSON.stringify({ pin }),
      }),
    listLocations: () => request<Location[]>('/locations'),
    createLocation: (name: string) =>
      json<Location>('/locations', 'POST', { name }),
    renameLocation: (id: string, name: string) =>
      json<Location>(`/locations/${id}`, 'PATCH', { name }),
    createSubsection: (locationId: string, name: string) =>
      json(`/locations/${locationId}/subsections`, 'POST', { name }),
    renameSubsection: (id: string, name: string) =>
      json(`/subsections/${id}`, 'PATCH', { name }),
    deleteLocation: (id: string, reassignments: unknown[]) =>
      json<void>(`/locations/${id}/delete`, 'POST', { reassignments }),
    deleteSubsection: (id: string, reassignments: unknown[]) =>
      json<void>(`/subsections/${id}/delete`, 'POST', { reassignments }),
    listSupplies: (params: URLSearchParams) =>
      request<InventoryItem[]>(`/supplies?${params.toString()}`),
    getSupply: (id: string) => request<Supply>(`/supplies/${id}`),
    createSupply: (body: unknown) => json<Supply>('/supplies', 'POST', body),
    updateSupply: (id: string, body: unknown) =>
      json<Supply>(`/supplies/${id}`, 'PATCH', body),
    deleteSupply: (id: string) =>
      request<void>(`/supplies/${id}`, { method: 'DELETE' }),
    updatePrimaryQuantity: (id: string, quantity: string) =>
      json<Supply>(`/supplies/${id}/primary-quantity`, 'PATCH', { quantity }),
    updateBackupQuantity: (id: string, quantity: string) =>
      json<Supply>(`/supplies/${id}/backup-quantity`, 'PATCH', { quantity }),
    deleteBackup: (id: string) =>
      request<Supply>(`/supplies/${id}/backup`, { method: 'DELETE' }),
    listBackupInventory: (params: URLSearchParams) =>
      request<BackupInventoryItem[]>(`/inventory/backup?${params.toString()}`),
  };
};
