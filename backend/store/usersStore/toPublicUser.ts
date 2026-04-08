import type { PublicUser, User } from '../../types';

export const toPublicUser = (user: User): PublicUser => {
	const { id, email, name } = user;
	return { id, email, name };
};
