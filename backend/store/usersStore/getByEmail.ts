import type { User } from '../../types';

export const getByEmail =
	(usersByEmail: Map<string, User>) =>
	(email: string): User | null =>
		usersByEmail.get(email) ?? null;
