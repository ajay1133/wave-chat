import express from 'express';
import bcrypt from 'bcryptjs';
import { customRouteWrapper } from '../http/customRouteWrapper';

export function createUsersRouter({ prisma }) {
	const router = express.Router();

	router.get(
		'/users/lookup',
		customRouteWrapper(async (req, res) => {
			const query = String(req?.query?.query ?? '').trim();
			if (!query) {
				res.status(400).json({ error: 'Error query is required' });
				return;
			}
			const user = await prisma.user.findFirst({
				where: {
					OR: [
						{ id: query },
						{ name: query },
						{ email: query.toLowerCase() }
					]
				},
				select: {
					id: true,
					email: true,
					name: true
				}
			});
			if (!user) {
				res.status(404).json({ error: 'Error user not found' });
				return;
			}
			res.json(user);
		})
	);

	router.get(
		'/users/search',
		customRouteWrapper(async (req, res) => {
			const query = String(req?.query?.query ?? '').trim();
			const excludeUserId = String(req?.query?.excludeUserId ?? '').trim();
			const takeRaw = Number(req?.query?.take ?? 5);
			const take = Number.isFinite(takeRaw) ? Math.max(1, Math.min(10, takeRaw)) : 5;
			if (!query) {
				res.json({ users: [] });
				return;
			}
			const users = await prisma.user.findMany({
				where: {
					AND: [
						excludeUserId ? { id: { not: excludeUserId } } : {},
						{
							OR: [
								{ email: { contains: query } },
								{ name: { contains: query } }
							]
						}
					]
				},
				select: {
					id: true,
					email: true,
					name: true
				},
				take
			});
			res.json({ users });
		})
	);

	router.post(
		'/users',
		customRouteWrapper(async (req, res) => {
			const email = String(req?.body?.email ?? '').trim().toLowerCase();
			const name = String(req?.body?.name ?? '').trim();
			const passwordRaw = req?.body?.password;
			const passwordPlain =
				typeof passwordRaw === 'string' && passwordRaw.trim() ? passwordRaw.trim() : email.split('@')[0];
			if (!email || !name) {
				res.status(400).json({ error: 'Error email or name is missing' });
				return;
			}
			const password = await bcrypt.hash(passwordPlain, 10);
			const user = await prisma.user.create({
				data: { email, name, password }
			});
			res.json({
				id: user.id,
				email: user.email,
				name: user.name
			});
		})
	);

	return router;
}
