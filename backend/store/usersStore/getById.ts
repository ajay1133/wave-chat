import type { User } from '../../types';

export const getById =
	(usersById: Map<string, User>) =>
	(id: string): User | null =>
		usersById.get(id) ?? null;
