import type { ChatMessage } from '../../types';

export const addMessageIdToConnectionIndex =
	(messageIdsByConnectionId: Map<string, string[]>) =>
	(msg: ChatMessage): void => {
		const list = messageIdsByConnectionId.get(msg.connectionId) ?? [];
		list.push(msg.id);
		messageIdsByConnectionId.set(msg.connectionId, list);
	};
