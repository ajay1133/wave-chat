import express from 'express';
import type { Request, Response } from 'express';
import type { ErrorResponse, LoginRequestBody, LoginResponse } from '../types';

export function loginUser({ store }: { store: any }) {
	return async (
		req: Request<{}, LoginResponse | ErrorResponse, LoginRequestBody>,
		res: Response<LoginResponse | ErrorResponse>
	) => {
		const { email, password } = req.body;
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

export function authRoutes({ store }: { store: any }) {
	const router = express.Router();
	router.post('/auth/login', loginUser({ store }));
	return router;
}
