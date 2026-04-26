import express from 'express';
import type { Request, Response } from 'express';
import type { 
	SearchUsersQuery, SearchUsersResponse, UpdateUserResponse, UserOnlineStatus, ErrorResponse 
} from '../types';

export function searchUsers({ store }: { store: any }) {
	return async (
		req: Request<{}, SearchUsersResponse, {}, SearchUsersQuery>,
		res: Response<SearchUsersResponse>
	) => {
		const { query, excludeUserId, take: qTake } = req.query;
		const take = Number(qTake ?? '5');
		if (!query) {
			res.json({ users: [] });
			return;
		}
		const users = store.users.search({ 
			query, excludeUserId, take 
		});
		res.json({ users });
	};
}

export function updateUser({ store }: { store: any }) {
	return async (
		req: Request<{ userId: string }, UpdateUserResponse | ErrorResponse, { onlineStatus: UserOnlineStatus }, {}>,
		res: Response<UpdateUserResponse | ErrorResponse>
	) => {
		const { userId }: { userId: string } = req.params;
		const { onlineStatus }: { onlineStatus: UserOnlineStatus } = req.body;
		const user = store.users.getById(userId);
		if (!user) {
			res.status(400).json({ error: 'Error invalid user' });
			return;
		}
		user.onlineStatus = onlineStatus;
		res.json(user);
	};
}

export function usersRoutes({ store }: { store: any }) {
	const router = express.Router();
	router.get('/users/search', searchUsers({ store }));
	router.put('/users/updateUser/:userId', updateUser({ store }));
	return router;
}
