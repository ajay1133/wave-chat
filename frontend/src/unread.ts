type UnreadEntry = { count: number; lastMessageId: string | null };
export type UnreadState = Record<string, UnreadEntry>;

const KEY = 'wave-chat-unread';
const EVT = 'wave-chat-unread';

function readState(): UnreadState {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) {
      return JSON.parse(raw) as UnreadState;
    }
    return {};
  } catch {
    return {};
  }
}

function writeState(state: UnreadState) {
  localStorage.setItem(KEY, JSON.stringify(state));
  window.dispatchEvent(new Event(EVT));
}

export function getUnreadState(): UnreadState {
  return readState();
}

export function getUnread(connectionId: string): UnreadEntry {
  const state = readState();
  return state[connectionId] ?? { count: 0, lastMessageId: null };
}

export function incrementUnread(connectionId: string, lastMessageId: string) {
  const state = readState();
  const existing = state[connectionId] ?? { count: 0, lastMessageId: null };
  state[connectionId] = { count: existing.count + 1, lastMessageId };
  writeState(state);
}

export function clearUnread(connectionId: string) {
  const state = readState();
  if (!state[connectionId]) {
    return;
  }
  delete state[connectionId];
  writeState(state);
}

export function subscribeUnread(callback: () => void) {
  const handler = () => callback();
  window.addEventListener(EVT, handler);
  window.addEventListener('storage', handler);
  return () => {
    window.removeEventListener(EVT, handler);
    window.removeEventListener('storage', handler);
  };
}
