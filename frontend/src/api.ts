import config from './config';
import { getUser } from './auth';

async function request(path: string, init?: any) {
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
    const errorMessage = typeof response === 'object' && response?.error
        ? String(response.error)
        : typeof response === 'string' && response 
          ? response : (response?.statusText ?? 'Something went wrong');
    throw new Error(errorMessage);
  }
  if (typeof response === 'string') {
    throw new Error('Invalid JSON response from server');
  }
  return response;
}

export function login(email: string, password: string) {
  return request('/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) });
}

export function mkConn(initiatorId: string, recipientId: string) {
  return request('/connections', { method: 'POST', body: JSON.stringify({ initiatorId, recipientId }) });
}

export function getChatMsgs(connectionId: string, before?: string, limit?: number) {
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

export function searchUsers(query: string, excludeUserId: string, take = 5) {
  const params = new URLSearchParams();
  params.set('query', query);
  params.set('excludeUserId', excludeUserId);
  params.set('take', String(take));
  return request(`/users/search?${params.toString()}`);
}

export function getConnectionMetadata(connectionId: string) {
  return request(`/connections/${encodeURIComponent(connectionId)}`);
}
