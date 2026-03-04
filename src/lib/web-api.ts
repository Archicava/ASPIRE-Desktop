import { CaseRecord, CaseSubmission, UserRecord } from '../types';

type ApiMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

type ApiRequestOptions = {
  method?: ApiMethod;
  body?: unknown;
  headers?: Record<string, string>;
};

type AuthUserPayload = {
  username: string;
  role?: string;
  metadata?: Record<string, unknown>;
};

type LoginResponse = {
  success: true;
  token: string;
  user: AuthUserPayload;
};

type SessionResponse = {
  authenticated: true;
  user: AuthUserPayload;
};

type UsersResponse = {
  success: boolean;
  users?: UserRecord[];
  error?: string;
};

type UserMutationResponse = {
  success: boolean;
  user?: UserRecord;
  error?: string;
};

type PasswordMutationResponse = {
  success: boolean;
  error?: string;
};

export class DesktopApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly data?: unknown
  ) {
    super(message);
    this.name = 'DesktopApiError';
  }
}

async function requestApi<T>(path: string, options: ApiRequestOptions = {}): Promise<T> {
  const desktopApi = window.aspireDesktop?.api;
  if (!desktopApi) {
    throw new DesktopApiError('Desktop API bridge is unavailable.', 500);
  }

  const response = await desktopApi.request({
    path,
    method: options.method ?? 'GET',
    body: options.body,
    headers: options.headers
  });

  if (!response.ok) {
    throw new DesktopApiError(
      response.error ?? `Request failed for ${path}`,
      response.status,
      response.data
    );
  }

  return response.data as T;
}

export async function getWebAppBaseUrl(): Promise<string> {
  return window.aspireDesktop.api.baseUrl();
}

export async function loginWithWebApp(payload: {
  username: string;
  password: string;
}): Promise<LoginResponse> {
  return requestApi<LoginResponse>('/api/auth/login', {
    method: 'POST',
    body: payload
  });
}

export async function logoutFromWebApp(): Promise<{ success: boolean }> {
  return requestApi<{ success: boolean }>('/api/auth/logout', {
    method: 'POST'
  });
}

export async function getWebSession(): Promise<SessionResponse> {
  return requestApi<SessionResponse>('/api/auth/session');
}

export async function listCases(): Promise<CaseRecord[]> {
  return requestApi<CaseRecord[]>('/api/cases');
}

export async function getCase(caseId: string): Promise<CaseRecord> {
  return requestApi<CaseRecord>(`/api/cases/${encodeURIComponent(caseId)}`);
}

export async function createCase(submission: CaseSubmission): Promise<CaseRecord> {
  return requestApi<CaseRecord>('/api/cases', {
    method: 'POST',
    body: submission
  });
}

export async function retryCase(caseId: string): Promise<{
  success: boolean;
  caseRecord?: CaseRecord;
  error?: string;
}> {
  return requestApi(`/api/cases/${encodeURIComponent(caseId)}/retry`, {
    method: 'POST'
  });
}

export async function deleteCase(caseId: string): Promise<{
  success: boolean;
  message?: string;
  error?: string;
}> {
  return requestApi(`/api/cases/${encodeURIComponent(caseId)}`, {
    method: 'DELETE'
  });
}

export async function getCStoreStatus(): Promise<Record<string, unknown>> {
  return requestApi<Record<string, unknown>>('/api/cstore-status');
}

export async function getR1FsStatus(): Promise<Record<string, unknown>> {
  return requestApi<Record<string, unknown>>('/api/r1fs-status');
}

export async function listUsers(): Promise<UserRecord[]> {
  const response = await requestApi<UsersResponse>('/api/users');
  if (!response.success) {
    throw new DesktopApiError(response.error ?? 'Failed to list users.', 500, response);
  }
  return response.users ?? [];
}

export async function createUser(payload: {
  username: string;
  password: string;
  role?: 'admin' | 'user';
  displayName?: string;
}): Promise<UserRecord> {
  const response = await requestApi<UserMutationResponse>('/api/users', {
    method: 'POST',
    body: payload
  });
  if (!response.success || !response.user) {
    throw new DesktopApiError(response.error ?? 'Failed to create user.', 500, response);
  }
  return response.user;
}

export async function updateUser(payload: {
  username: string;
  role?: 'admin' | 'user';
  displayName?: string;
}): Promise<UserRecord> {
  const response = await requestApi<UserMutationResponse>('/api/users', {
    method: 'PATCH',
    body: payload
  });
  if (!response.success || !response.user) {
    throw new DesktopApiError(response.error ?? 'Failed to update user.', 500, response);
  }
  return response.user;
}

export async function changeUserPassword(payload: {
  username: string;
  currentPassword: string;
  newPassword: string;
}): Promise<void> {
  const response = await requestApi<PasswordMutationResponse>('/api/users', {
    method: 'PUT',
    body: payload
  });
  if (!response.success) {
    throw new DesktopApiError(response.error ?? 'Failed to update password.', 500, response);
  }
}
