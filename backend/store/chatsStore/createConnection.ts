import type { ChatConnection } from '../../types';
import { newId } from './newId';

export const createConnection =
	(connectionsById: Map<string, ChatConnection>) =>
	({ initiatorId, recipientId }: { initiatorId: string; recipientId: string }): ChatConnection => {
		const now = new Date();
		const data: ChatConnection = {
			id: newId(),
			initiatorId,
			recipientId,
			status: 'pending',
			createdAt: now,
			updatedAt: now
		};
		connectionsById.set(data.id, data);
		return data;
	};
