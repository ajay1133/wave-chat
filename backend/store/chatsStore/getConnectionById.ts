import type { ChatConnection } from '../../types';

export const getConnectionById =
	(connectionsById: Map<string, ChatConnection>) =>
	(id: string): ChatConnection | null => {
		return connectionsById.get(id) ?? null;
	};
