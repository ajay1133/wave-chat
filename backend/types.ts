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
