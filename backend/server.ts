import express from 'express';
import cors from 'cors';
import http from 'http';
import { Server as IOServer } from 'socket.io';
import CONFIG from './config';
import { prisma } from './db';
import { createAuthRouter } from './routes/auth';
import { createConnectionsRouter } from './routes/connections';
import { createHealthRouter } from './routes/health';
import { createUsersRouter } from './routes/users';
import { createSocketService } from './socketService';

const app = express();
const corsOptions = { origin: '*', methods: ['GET', 'POST', 'OPTIONS'], allowedHeaders: ['Content-Type', 'x-user-id'] };
app.use(cors(corsOptions));
app.options(/.*/, cors(corsOptions));
app.use(express.json({ limit: '128kb' }));

const router = express.Router();
app.use(router);

const httpServer = http.createServer(app);
const io = new IOServer(httpServer, { cors: { origin: '*', methods: ['GET', 'POST'] } });

const socketService = createSocketService(io);
socketService.registerHandlers(prisma);

router.use(createHealthRouter());
router.use(createUsersRouter({ prisma }));
router.use(createAuthRouter({ prisma }));
router.use(createConnectionsRouter({ prisma, realtime: socketService.realtime }));

httpServer.listen(CONFIG.PORT, () => {
	console.log(`Server listening on *:${CONFIG.PORT} 🚀`);
});
