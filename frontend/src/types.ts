export type User = any;
export type ChatMessage = any;
export type ConnectionMeta = any;

export type IncomingRequest = {
  connectionId: string;
  fromUser: { id: string; name: string };
};

export type StatusNotice = {
  connectionId: string;
  status: 'accepted' | 'rejected';
  byUser?: { id: string; name: string };
};

export type StatusPayload = {
  connectionId: string;
  byUser?: { id: string; name: string };
};
