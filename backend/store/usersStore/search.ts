import type { PublicUser, User } from '../../types';
import { toPublicUser } from './toPublicUser';

export const search =
	(usersById: Map<string, User>) =>
	({ query, excludeUserId, take }: { query: string; excludeUserId?: string | null; take?: number }): PublicUser[] => {
		const limit = take ?? 5;
		if (!query) {
			return [];
		}
		const res: PublicUser[] = [];
		for (const user of usersById.values()) {
			if (excludeUserId && user.id === excludeUserId) {
				continue;
			}
			if (user.id.includes(query) || user.email.includes(query) || user.name.includes(query)) {
				res.push(toPublicUser(user));
			}
			if (res.length >= limit) {
				break;
			}
		}
		return res;
	};
