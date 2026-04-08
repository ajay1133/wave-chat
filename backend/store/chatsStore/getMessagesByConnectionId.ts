import type { ChatMessage } from '../../types';

export const getMessagesByConnectionId =
	(messagesById: Map<string, ChatMessage>, messageIdsByConnectionId: Map<string, string[]>) =>
	({
		connectionId,
		before,
		limit
	}: {
		connectionId: string;
		before?: Date | null;
		limit?: number | null;
	}): ChatMessage[] => {
		const ids = messageIdsByConnectionId.get(connectionId) ?? [];
		const res: ChatMessage[] = [];
		for (const id of ids) {
			const m = messagesById.get(id);
			if (!m) {
				continue;
			}
			if (before && m.createdAt.getTime() >= before.getTime()) {
				continue;
			}
			res.push(m);
		}
		res.sort((a, b) => {
			const d = b.createdAt.getTime() - a.createdAt.getTime();
			return d !== 0 ? d : b.id.localeCompare(a.id);
		});
		const sliced = typeof limit === 'number' && Number.isFinite(limit) ? res.slice(0, limit) : res;
		return sliced.reverse();
	};
