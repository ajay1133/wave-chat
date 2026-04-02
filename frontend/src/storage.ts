const ME_KEY = 'wave-chat-user';

type Me = { id: string; name: string; email: string };

export function setUser(me: Me) {
  localStorage.setItem(ME_KEY, JSON.stringify(me));
}

export function getUser(): Me | null {
  const raw = localStorage.getItem(ME_KEY);
  if (!raw) {
    return null;
  }
  try {
    const parsed = JSON.parse(raw) as Me;
    localStorage.setItem(ME_KEY, JSON.stringify(parsed));
    return parsed;
  } catch {
    return null;
  }
}

export function clearUser() {
  localStorage.removeItem(ME_KEY);
}
