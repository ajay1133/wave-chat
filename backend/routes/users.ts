import express from 'express';

function createSearchUsersHandler({ store }) {
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

export function usersRoutes({ store }) {
	const router = express.Router();

	router.get('/users/search', createSearchUsersHandler({ store }));

	return router;
}
