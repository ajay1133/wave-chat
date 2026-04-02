import config from './config';

export type User = any;
export type MessageKind = any;
export type ChatMessage = any;
export type ConnectionMeta = any;

function getAuthUserId() {
  try {
    const raw = localStorage.getItem('wave-chat-user');
    if (!raw) {
      return '';
    }
    const parsed = JSON.parse(raw) as any;
    return String(parsed?.id ?? '').trim();
  } catch {
    return '';
  }
}

async function request(path: string, init?: RequestInit): Promise<any> {
  const authUserId = getAuthUserId();
  const res = await fetch(`${config.API_ENDPOINT}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(authUserId ? { 'x-user-id': authUserId } : {}),
      ...(init?.headers ?? {})
    }
  });
  const text = await res.text();
  const body = (() => {
    if (!text) {
      return undefined;
    }
    try {
      return JSON.parse(text) as any;
    } catch {
      return text;
    }
  })();
  if (!res.ok) {
    const errorMessage =
      typeof body === 'object' && body && (body as any).error
        ? String((body as any).error)
        : typeof body === 'string' && body.trim()
          ? body
          : res.statusText;
    throw new Error(errorMessage);
  }
  if (typeof body === 'string') {
    throw new Error('Invalid JSON response from server');
  }
  return body;
}

export function lookupUser(query: string) {
  return request(`/users/lookup?query=${encodeURIComponent(query)}`);
}

export function login(email: string, password: string) {
  return request('/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) });
}

export function createUser(email: string, name: string) {
  return request('/users', { method: 'POST', body: JSON.stringify({ email, name }) });
}

export function createConnection(initiatorId: string, recipientId: string) {
  return request(
    '/connections',
    { method: 'POST', body: JSON.stringify({ initiatorId, recipientId }) }
  );
}

export function getUserMessages(connectionId: string, before?: string, limit?: number) {
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

export function getLastConnection(userId: string, otherId: string) {
  const params = new URLSearchParams();
  params.set('userId', userId);
  params.set('otherId', otherId);
  return request(`/connections/last?${params.toString()}`);
}

export function getConnectionMeta(connectionId: string) {
  return request(`/connections/${encodeURIComponent(connectionId)}`);
}
