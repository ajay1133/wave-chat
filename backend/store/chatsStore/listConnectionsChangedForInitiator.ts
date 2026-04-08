import type { ChatConnection } from '../../types';

export const listConnectionsChangedForInitiator =
	(connectionsById: Map<string, ChatConnection>) =>
	({
		initiatorId,
		since,
		statuses,
		take
	}: {
		initiatorId: string;
		since?: Date | null;
		statuses?: string[];
		take?: number;
	}): ChatConnection[] => {
		const limit = typeof take === 'number' && Number.isFinite(take) ? Math.min(200, take) : 50;
		const excludeStatuses = new Set(Array.isArray(statuses) ? statuses : []);
		const res: ChatConnection[] = [];
		for (const c of connectionsById.values()) {
			if (
				c.initiatorId !== initiatorId ||
				excludeStatuses.has(c.status) ||
				(since && c.updatedAt.getTime() <= since.getTime())
			) {
				continue;
			}
			res.push(c);
		}
		res.sort((a, b) => a.updatedAt.getTime() - b.updatedAt.getTime());
		return res.slice(0, limit);
	};
