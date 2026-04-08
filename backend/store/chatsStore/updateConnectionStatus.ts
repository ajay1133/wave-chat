import type { ChatConnection, ConnectionStatus } from '../../types';

export const updateConnectionStatus =
	(connectionsById: Map<string, ChatConnection>) =>
	({ connectionId, status }: { connectionId: string; status: ConnectionStatus }): ChatConnection | null => {
		const c = connectionsById.get(connectionId);
		if (!c) {
			return null;
		}
		if (c.status !== status) {
			c.status = status;
			c.updatedAt = new Date();
		}
		return c;
	};
