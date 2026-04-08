import express from 'express';
import type { Request, Response } from 'express';
import type { SearchUsersQuery, SearchUsersResponse } from '../types';

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

export function usersRoutes({ store }: { store: any }) {
	const router = express.Router();
	router.get('/users/search', searchUsers({ store }));
	return router;
}
