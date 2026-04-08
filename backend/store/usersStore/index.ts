import type { User } from '../../types';
import { buildUserMapsFromDefaults } from './buildUserMapsFromDefaults';
import { getByEmail } from './getByEmail';
import { getById } from './getById';
import { search } from './search';

export { buildUserMapsFromDefaults };

export const userStore = (usersById: Map<string, User>, usersByEmail: Map<string, User>) => ({
	getById: getById(usersById),
	getByEmail: getByEmail(usersByEmail),
	search: search(usersById)
});
