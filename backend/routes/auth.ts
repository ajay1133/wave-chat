import express from 'express';

function createLoginHandler({ store }) {
	return async (req, res) => {
		const email = req.body.email;
		const password = req.body.password;
		if (!email || !password) {
			res.status(400).json({ error: 'Error email or password is missing' });
			return;
		}
		const user = store.users.getByEmail(email);
		if (!user) {
			res.status(401).json({ error: 'Error invalid credentials' });
			return;
		}
		if (password !== user.password) {
			res.status(401).json({ error: 'Error invalid password' });
			return;
		}
		res.json({
			id: user.id,
			email: user.email,
			name: user.name
		});
	};
}

export function authRoutes({ store }) {
	const router = express.Router();
	router.post('/auth/login', createLoginHandler({ store }));
	return router;
}
