import express from 'express';

export function createSearchUsersHandler({ store }: { store: any }) {
	return async (req, res) => {
		const { query, excludeUserId, take: qTake } = req.query ?? {};
		const take = Number(qTake ?? 5);
		if (!query) {
			res.json({ users: [] });
			return;
		}
		const users = store.users.search({ query, excludeUserId, take });
		res.json({ users });
	};
}

export function usersRoutes({ store }: { store: any }) {
	const router = express.Router();
	router.get('/users/search', createSearchUsersHandler({ store }));
	return router;
}
