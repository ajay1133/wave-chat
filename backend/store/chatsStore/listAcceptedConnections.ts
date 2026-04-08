import type { ChatConnection } from '../../types';

export const listAcceptedConnections = (connectionsById: Map<string, ChatConnection>) => (): ChatConnection[] => {
	const res: ChatConnection[] = [];
	for (const c of connectionsById.values()) {
		if (c.status === 'accepted') {
			res.push(c);
		}
	}
	return res;
};
