import type { ChatConnection, ChatMessage } from '../types';
import { chatStore } from './chatsStore';
import { buildUserMapsFromDefaults, userStore } from './usersStore';

export const createStore = () => {
	const { usersById, usersByEmail } = buildUserMapsFromDefaults();
	const connectionsById = new Map<string, ChatConnection>();
	const messagesById = new Map<string, ChatMessage>();
	const messageIdsByConnectionId = new Map<string, string[]>();
	return {
		users: userStore(usersById, usersByEmail),
		chats: chatStore(connectionsById, messagesById, messageIdsByConnectionId)
	};
};
