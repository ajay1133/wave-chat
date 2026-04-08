import type { User } from '../../types';
import { loadDefaultUsers } from './loadDefaultUsers';

export const buildUserMapsFromDefaults = (): {
	usersById: Map<string, User>;
	usersByEmail: Map<string, User>;
} => {
	const usersById = new Map<string, User>();
	const usersByEmail = new Map<string, User>();
	for (const u of loadDefaultUsers() ?? []) {
		const { id, email, name, password } = u ?? {};
		if (!id || !email || !name || !password) {
			continue;
		}
		const user = { id, email, name, password };
		usersById.set(id, user);
		usersByEmail.set(email, user);
	}
	return { usersById, usersByEmail };
};
