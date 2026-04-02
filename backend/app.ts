import express from 'express';
import cors from 'cors';
import http from 'http';
import { Server as IOServer } from 'socket.io';
import { authRoutes } from './routes/auth';
import { connectionRoutes } from './routes/connections';
import { healthRoutes } from './routes/health';
import { usersRoutes } from './routes/users';
import { socketService } from './socketService';
import { mkStore } from './store';

export function mkApp() {
	const app = express();
	const corsOpt = {
		origin: '*',
		methods: ['GET', 'POST', 'OPTIONS'],
		allowedHeaders: ['Content-Type', 'x-user-id']
	};
	app.use(cors(corsOpt));
	app.options(/.*/, cors(corsOpt));
	app.use(express.json({ limit: '128kb' }));

	const router = express.Router();
	app.use(router);

	const httpServer = http.createServer(app);
	const io = new IOServer(httpServer, {
		cors: { origin: '*', methods: ['GET', 'POST'] }
	});

	const store = mkStore();
	const socketServiceIns = socketService(io, store);
	socketServiceIns.registerHandlers();

	router.use(healthRoutes());
	router.use(usersRoutes({ store }));
	router.use(authRoutes({ store }));
	router.use(
		connectionRoutes({
			store,
			realtime: socketServiceIns.realtime
		})
	);

	app.use((err, req, res, next) => {
		console.error(`${req.method} ${req.path} failed`, err);
		if (res.headersSent) {
			return next(err);
		}
		const msg = err instanceof Error ? err.message : 'Something went wrong';
		res.status(500).json({ error: `internal error: ${msg}` });
	});

	return {
		app,
		httpServer,
		io,
		store,
		socketServiceIns
	};
}
