import type { ChatConnection, ChatMessage } from '../../types';

export const getLastActivityAtForConnection =
	(
		connectionsById: Map<string, ChatConnection>,
		messagesById: Map<string, ChatMessage>,
		messageIdsByConnectionId: Map<string, string[]>
	) =>
	(connectionId: string): Date | null => {
		const c = connectionsById.get(connectionId);
		if (!c) {
			return null;
		}
		const ids = messageIdsByConnectionId.get(connectionId) ?? [];
		let best: Date | null = null;
		for (const id of ids) {
			const m = messagesById.get(id);
			if (!m) {
				continue;
			}
			if (!best || m.createdAt.getTime() > best.getTime()) {
				best = m.createdAt;
			}
		}
		return best ?? c.createdAt;
	};
