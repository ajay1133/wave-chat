import express from 'express';
import { customRouteWrapper } from '../http/customRouteWrapper';

async function getAuthedUserId(prisma, req: any, res: any) {
	const id = String(req?.header('x-user-id') ?? '').trim();
	if (!id) {
		res.status(401).json({ error: 'Error x-user-id is missing' });
		return null;
	}
	const user = await prisma.user.findUnique({
		where: { id },
		select: { id: true }
	});
	if (!user) {
		res.status(401).json({ error: 'Error user not found' });
		return null;
	}
	return id;
}

export function createConnectionsRouter({ prisma, realtime }) {
	const router = express.Router();

	router.post(
		'/connections',
		customRouteWrapper(async (req, res) => {
			const authedUserId = await getAuthedUserId(prisma, req, res);
			if (!authedUserId) {
				return;
			}
			const initiatorId = String(req?.body?.initiatorId ?? '').trim();
			const recipientId = String(req?.body?.recipientId ?? '').trim();
			if (!initiatorId || !recipientId) {
				res.status(400).json({ error: 'Error initiatorId or recipientId is missing' });
				return;
			}
			if (initiatorId !== authedUserId) {
				res.status(403).json({ error: 'Error initiatorId does not match with current user' });
				return;
			}
			if (initiatorId === recipientId) {
				res.status(400).json({ error: 'Error user attempting to chat with himself' });
				return;
			}
			const [initiator, recipient] = await Promise.all([
				prisma.user.findUnique({
					where: { id: initiatorId },
					select: { 
                        id: true, 
                        name: true 
                    }
				}),
				prisma.user.findUnique({
					where: { id: recipientId },
					select: { 
                        id: true, 
                        name: true 
                    }
				})
			]);
			if (!initiator) {
				res.status(404).json({ error: 'Error initiator not found' });
				return;
			}
			if (!recipient) {
				res.status(404).json({ error: 'Error recipient not found' });
				return;
			}
			const connection = await prisma.chatConnection.create({
				data: { 
                    initiatorId, 
                    recipientId, 
                    status: 'pending' 
                }
			});
			const requestMsg = await prisma.chatMessage.create({
				data: {
					connectionId: connection.id,
					senderId: null,
					kind: 'system',
					content: `Request sent to ${recipient.name}`
				}
			});
			realtime.emitToUser(initiatorId, 'chat-message', requestMsg);
			if (realtime.isUserOnline(recipientId)) {
				realtime.emitToUser(recipientId, 'chat-incoming', {
					connectionId: connection.id,
					fromUser: {
						id: initiator.id,
						name: initiator.name
					}
				});
			}
			res.json({
				connectionId: connection.id,
				status: connection.status
			});
		})
	);

	router.get(
		'/connections/last',
		customRouteWrapper(async (req, res) => {
			const authedUserId = await getAuthedUserId(prisma, req, res);
			if (!authedUserId) {
				return;
			}
			const userId = String(req?.query.userId ?? '').trim();
			const otherId = String(req?.query.otherId ?? '').trim();
			if (!userId || !otherId) {
				res.status(400).json({ error: 'Error userId or otherId is missing' });
				return;
			}
			if (userId !== authedUserId) {
				res.status(403).json({ error: 'Error userId does not match with current user' });
				return;
			}
			const connection = await prisma.chatConnection.findFirst({
				where: {
					OR: [
						{ initiatorId: userId, recipientId: otherId },
						{ initiatorId: otherId, recipientId: userId }
					]
				},
				orderBy: { updatedAt: 'desc' },
				select: {
					id: true,
					status: true
				}
			});
			res.json({
				connectionId: connection?.id ?? null,
				status: connection?.status ?? null
			});
		})
	);

	router.get(
		'/connections/:connectionId',
		customRouteWrapper(async (req, res) => {
			const authedUserId = await getAuthedUserId(prisma, req, res);
			if (!authedUserId) {
				return;
			}
			const connectionId = String(req?.params?.connectionId).trim();
			const connection = await prisma.chatConnection.findUnique({
				where: { id: connectionId },
				include: {
					initiator: {
						select: {
							id: true,
							email: true,
							name: true
						}
					},
					recipient: {
						select: {
							id: true,
							email: true,
							name: true
						}
					}
				}
			});
			if (!connection) {
				res.status(404).json({ error: 'Error connection not found' });
				return;
			}
			if (connection.initiatorId !== authedUserId && connection.recipientId !== authedUserId) {
				res.status(403).json({ error: 'Error forbidden' });
				return;
			}
			res.json({
				id: connection.id,
				status: connection.status,
				initiator: connection.initiator,
				recipient: connection.recipient,
				initiatorId: connection.initiatorId,
				recipientId: connection.recipientId
			});
		})
	);

	router.get(
		'/connections/:connectionId/messages',
		customRouteWrapper(async (req, res) => {
			const authedUserId = await getAuthedUserId(prisma, req, res);
			if (!authedUserId) {
				return;
			}
			const connectionId = String(req?.params?.connectionId);
			const conn = await prisma.chatConnection.findUnique({
				where: { id: connectionId },
				select: {
					initiatorId: true,
					recipientId: true
				}
			});
			if (!conn) {
				res.status(404).json({ error: 'Error connection not found' });
				return;
			}
			if (conn.initiatorId !== authedUserId && conn.recipientId !== authedUserId) {
				res.status(403).json({ error: 'Error forbidden' });
				return;
			}
			const limitRaw = req.query.limit;
			const limitNum = limitRaw === undefined ? null : Number(limitRaw);
			const limit = limitNum !== null && Number.isFinite(limitNum) ? Math.max(1, limitNum) : null;
			const beforeRaw = String(req.query.before ?? '').trim();
			const before = beforeRaw ? new Date(beforeRaw) : null;
			const where = before ? { connectionId, createdAt: { lt: before } } : { connectionId };
			const messages = await prisma.chatMessage.findMany({
				where,
				orderBy: [
                    { createdAt: 'desc' }, 
                    { id: 'desc' }
                ],
				...(limit ? { take: limit } : {})
			});
			res.json({ 
                messages: messages.reverse() 
            });
		})
	);

	return router;
}
