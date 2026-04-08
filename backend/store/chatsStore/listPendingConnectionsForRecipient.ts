import type { ChatConnection } from '../../types';

export const listPendingConnectionsForRecipient =
	(connectionsById: Map<string, ChatConnection>) =>
	(recipientId: string): ChatConnection[] => {
		const res: ChatConnection[] = [];
		for (const c of connectionsById.values()) {
			if (c.recipientId === recipientId && c.status === 'pending') {
				res.push(c);
			}
		}
		res.sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
		return res;
	};
