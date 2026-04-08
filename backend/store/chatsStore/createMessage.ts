import type { ChatMessage, MessageKind } from '../../types';
import { newId } from './newId';

export const createMessage =
	(messagesById: Map<string, ChatMessage>, addMessageToConnectionIndex: (msg: ChatMessage) => void) =>
	({
		connectionId,
		senderId,
		kind,
		content
	}: {
		connectionId: string;
		senderId: string | null;
		kind: MessageKind;
		content: string;
	}): ChatMessage => {
		const msg: ChatMessage = {
			id: newId(),
			connectionId,
			senderId,
			kind,
			content,
			createdAt: new Date()
		};
		messagesById.set(msg.id, msg);
		addMessageToConnectionIndex(msg);
		return msg;
	};
