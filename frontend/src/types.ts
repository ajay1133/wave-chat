export type ConnectionStatus = 'pending' | 'accepted' | 'rejected' | 'ended';

export type User = {
  id: string;
  email: string;
  name: string;
};

export type ChatMessageKind = 'system' | 'user';

export type ChatMessage = {
  id: string;
  connectionId: string;
  senderId: string | null;
  kind: ChatMessageKind;
  content: string;
  createdAt: string;
};

export type ConnectionMeta = {
  id: string;
  status: ConnectionStatus;
  initiator: User;
  recipient: User;
  initiatorId: string;
  recipientId: string;
};

export type LoginResponse = User;

export type CreateConnectionResponse = {
  connectionId: string;
  status: ConnectionStatus;
};

export type SearchUsersResponse = {
  users: User[];
};

export type GetMessagesByConnectionIdResponse = {
  messages: ChatMessage[];
};

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
