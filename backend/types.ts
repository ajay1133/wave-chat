export type User = {
	id: string;
	email: string;
	name: string;
	password: string;
};

export type PublicUser = {
	id: string;
	email: string;
	name: string;
};

export type ConnectionStatus = 'pending' | 'accepted' | 'rejected' | 'ended';

export type ChatConnection = {
	id: string;
	initiatorId: string;
	recipientId: string;
	status: ConnectionStatus;
	createdAt: Date;
	updatedAt: Date;
};

export type MessageKind = 'system' | 'user';

export type ChatMessage = {
	id: string;
	connectionId: string;
	senderId: string | null;
	kind: MessageKind;
	content: string;
	createdAt: Date;
};

export type ErrorResponse = {
	error: string;
};

export type LoginRequestBody = {
	email?: string;
	password?: string;
};

export type LoginResponse = {
	id: string;
	email: string;
	name: string;
};

export type SearchUsersQuery = {
	query?: string;
	excludeUserId?: string;
	take?: string;
};

export type SearchUsersResponse = {
	users: PublicUser[];
};

export type PostConnectionsRequestBody = {
	initiatorId?: string;
	recipientId?: string;
};

export type PostConnectionsResponse = {
	connectionId: string;
	status: ConnectionStatus;
};

export type ConnectionParams = {
	connectionId: string;
};

export type GetConnectionResponse = {
	id: string;
	status: ConnectionStatus;
	initiator: PublicUser;
	recipient: PublicUser;
	initiatorId: string;
	recipientId: string;
};

export type GetMessagesQuery = {
	limit?: string;
	before?: string;
};

export type GetMessagesResponse = {
	messages: ChatMessage[];
};
