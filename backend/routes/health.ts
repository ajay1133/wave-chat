import express from 'express';
import type { Request, Response } from 'express';

export function getHealth(req: Request, res: Response<{ ok: true }>) {
	res.json({ ok: true });
}

export function healthRoutes() {
	const router = express.Router();
	router.get('/health', getHealth);
	return router;
}
