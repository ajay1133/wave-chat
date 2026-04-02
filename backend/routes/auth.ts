import express from 'express';
import bcrypt from 'bcryptjs';
import { customRouteWrapper } from '../http/customRouteWrapper';

export function createAuthRouter({ prisma }) {
	const router = express.Router();

	router.post(
		'/auth/login',
		customRouteWrapper(async (req, res) => {
			const email = String(req?.body?.email ?? '')
				.trim()
				.toLowerCase();
			const password = String(req?.body?.password ?? '').trim();
			if (!email || !password) {
				res.status(400).json({ error: 'Error email or password is missing' });
				return;
			}
			const user = await prisma.user.findUnique({
				where: { email },
				select: {
					id: true,
					email: true,
					name: true,
					password: true
				}
			});
			if (!user) {
				res.status(401).json({ error: 'Error invalid credentials' });
				return;
			}
			const isPasswordMatched = await bcrypt.compare(password, user.password);
			if (!isPasswordMatched) {
				res.status(401).json({ error: 'Error invalid password' });
				return;
			}
			res.json({
				id: user.id,
				email: user.email,
				name: user.name
			});
		})
	);

	return router;
}
