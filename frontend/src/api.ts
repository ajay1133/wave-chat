import config from './config';
import { getUser } from './auth';
import type {
  ConnectionMeta,
  ConnectionResponse,
  GetMessagesByConnectionIdResponse,
  LoginResponse,
  SearchUsersResponse
} from './types';

async function request<T>(path: string, init?: any): Promise<T> {
  const user = getUser();
  const authUserId = user?.id ?? '';
  const res = await fetch(`${config.API_ENDPOINT}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(authUserId ? { 'x-user-id': authUserId } : {}),
      ...(init?.headers ?? {})
    }
  });
  let response;
  try {
    response = await res.json();
  } catch (e) {
    console.error(e);
  }
  if (!res?.ok) {
    const errorMessage =
      typeof response === 'object' && response?.error
        ? String(response.error)
        : typeof response === 'string' && response
          ? response
          : (response?.statusText ?? 'Something went wrong');
    throw new Error(errorMessage);
  }
  if (typeof response === 'string') {
    throw new Error('Invalid JSON response from server');
  }
  return response as T;
}

export function login(email: string, password: string): Promise<LoginResponse> {
  return request('/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) });
}

export function createConnection(initiatorId: string, recipientId: string): Promise<ConnectionResponse> {
  return request('/connections', { method: 'POST', body: JSON.stringify({ initiatorId, recipientId }) });
}

export function getMessagesByConnectionId(
  connectionId: string,
  before?: string,
  limit?: number
): Promise<GetMessagesByConnectionIdResponse> {
  const params = new URLSearchParams();
  if (typeof limit === 'number') {
    params.set('limit', String(limit));
  }
  if (before) {
    params.set('before', before);
  }
  const qs = params.toString();
  return request(`/connections/${encodeURIComponent(connectionId)}/messages${qs ? `?${qs}` : ''}`);
}

export function searchUsers(query: string, excludeUserId: string, take = 5): Promise<SearchUsersResponse> {
  const params = new URLSearchParams();
  params.set('query', query);
  params.set('excludeUserId', excludeUserId);
  params.set('take', String(take));
  return request(`/users/search?${params.toString()}`);
}

export function getConnectionMetadata(connectionId: string): Promise<ConnectionMeta> {
  return request(`/connections/${encodeURIComponent(connectionId)}`);
}
