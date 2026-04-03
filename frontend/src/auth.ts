import type { User } from './types';

const KEY = 'wave-chat-user';

export function getUser(): User | null {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) {
      return JSON.parse(raw) as User;
    }
    return null;
  } catch {
    return null;
  }
}

export function setUser(user: User) {
  localStorage.setItem(KEY, JSON.stringify(user));
}

export function clearUser() {
  localStorage.removeItem(KEY);
}
