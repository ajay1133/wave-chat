import express from 'express';

export function healthHandler(req: any, res: any) {
	res.json({ ok: true });
}

export function healthRoutes() {
	const router = express.Router();
	router.get('/health', healthHandler);
	return router;
}
