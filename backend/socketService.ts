import type { PrismaClient } from '@prisma/client';
import type { Server as IOServer, Socket } from 'socket.io';

export type Realtime = {
	isUserOnline(userId: string): boolean;
	emitToUser(userId: string, event: string, payload: any): void;
};

type AuthedSocket = Socket & { data: { userId?: string } };
const CHAT_INACTIVITY_MS = 60 * 60 * 1000;

export function createSocketService(io: IOServer) {
	const socketsByUserId = new Map<string, Set<string>>();

	function addSocket(userId: string, socketId: string) {
		const set = socketsByUserId.get(userId) ?? new Set<string>();
		set.add(socketId);
		socketsByUserId.set(userId, set);
	}

	function removeSocket(userId: string, socketId: string) {
		const set = socketsByUserId.get(userId);
		if (!set) {
			return;
		}
		set.delete(socketId);
		if (set.size === 0) {
			socketsByUserId.delete(userId);
		}
	}

	function isUserOnline(userId: string) {
		return (socketsByUserId.get(userId)?.size ?? 0) > 0;
	}

	function emitToUser(userId: string, event: string, payload: any) {
		const socketIds = socketsByUserId.get(userId);
		if (!socketIds) {
			return;
		}
		for (const socketId of socketIds) io.to(socketId).emit(event, payload);
	}

	async function endConnectionAndNotify(
		prisma: PrismaClient,
		params: { connectionId: string; systemMessage: string }
	) {
		const cId = String(params.connectionId ?? '').trim();
		if (!cId) {
			return;
		}
		const connection = await prisma.chatConnection.findUnique({
			where: { id: cId },
			select: { id: true, initiatorId: true, recipientId: true, status: true }
		});
		if (!connection) {
			return;
		}
		if (connection.status === 'ended' || connection.status === 'rejected') {
			return;
		}
		await prisma.chatConnection.update({ where: { id: cId }, data: { status: 'ended' } });
		const msg = await prisma.chatMessage.create({
			data: { connectionId: cId, senderId: null, kind: 'system', content: params.systemMessage }
		});
		emitToUser(connection.initiatorId, 'chat-ended', { connectionId: cId });
		emitToUser(connection.recipientId, 'chat-ended', { connectionId: cId });
		emitToUser(connection.initiatorId, 'chat-message', msg);
		emitToUser(connection.recipientId, 'chat-message', msg);
	}

	async function endInactiveChats(prisma: PrismaClient) {
		const cutoff = new Date(Date.now() - CHAT_INACTIVITY_MS);
		const candidates = await prisma.chatConnection.findMany({
			where: { status: 'accepted' },
			select: {
				id: true,
				createdAt: true,
				messages: {
					take: 1,
					orderBy: { createdAt: 'desc' },
					select: { createdAt: true }
				}
			}
		});
		for (const c of candidates) {
			const lastActivityAt = c.messages[0]?.createdAt ?? c.createdAt;
			if (lastActivityAt > cutoff) {
				continue;
			}
			await endConnectionAndNotify(prisma, {
				connectionId: c.id,
				systemMessage: 'Chat ended due to inactivity.'
			});
		}
	}

	function registerHandlers(prisma: PrismaClient) {
		io.on('connection', (socket: AuthedSocket) => {
			socket.on('auth', async ({ userId, since }: { userId: string; since?: string }) => {
				const id = String(userId ?? '').trim();
				if (!id) {
					return;
				}
				const user = await prisma.user.findUnique({ where: { id }, select: { id: true } });
				if (!user) {
					return;
				}
				socket.data.userId = id;
				addSocket(id, socket.id);
				// If the user was offline when chat requests were created, deliver them now.
				const pending = await prisma.chatConnection.findMany({
					where: { recipientId: id, status: 'pending' },
					orderBy: { createdAt: 'asc' },
					include: { initiator: { select: { id: true, name: true } } }
				});
				for (const c of pending) {
					socket.emit('chat-incoming', {
						connectionId: c.id,
						fromUser: { id: c.initiator.id, name: c.initiator.name }
					});
				}
				const sinceDate = (() => {
					if (!since) {
						return null;
					}
					const d = new Date(String(since));
					if (Number.isNaN(d.getTime())) {
						return null;
					}
					return d;
				})();
				const fallbackWindowMs = 7 * 24 * 60 * 60 * 1000;
				const fallbackSince = new Date(Date.now() - fallbackWindowMs);
				const cutoff = sinceDate ?? fallbackSince;
				const changed = await prisma.chatConnection.findMany({
					where: {
						initiatorId: id,
						status: { in: ['accepted', 'rejected'] },
						updatedAt: { gt: cutoff }
					},
					orderBy: { updatedAt: 'asc' },
					take: 50,
					include: { recipient: { select: { id: true, name: true } } }
				});
				for (const c of changed) {
					if (c.status === 'accepted') {
						socket.emit('chat-accepted', {
							connectionId: c.id,
							byUser: { id: c.recipient.id, name: c.recipient.name }
						});
					}
					if (c.status === 'rejected') {
						socket.emit('chat-rejected', {
							connectionId: c.id,
							byUser: { id: c.recipient.id, name: c.recipient.name }
						});
					}
				}
				socket.emit('auth-done', { serverTime: new Date().toISOString() });
			});
			socket.on(
				'chat-respond',
				async ({ connectionId, userId, accept }: { connectionId: string; userId: string; accept: boolean }) => {
					const authedUserId = String(socket.data.userId ?? '').trim();
					const payloadUserId = String(userId ?? '').trim();
					const id = authedUserId;
					const cId = String(connectionId ?? '').trim();
					if (!id || !cId) {
						return;
					}
					if (payloadUserId && payloadUserId !== authedUserId) {
						return;
					}
					const connection = await prisma.chatConnection.findUnique({
						where: { id: cId },
						include: {
							initiator: { select: { id: true, name: true } },
							recipient: { select: { id: true, name: true } }
						}
					});
					if (!connection) {
						return;
					}
					if (connection.recipientId !== id) {
						return;
					}
					if (connection.status !== 'pending') {
						emitToUser(id, 'chat-expired', { connectionId: cId, reason: 'not_pending' });
						return;
					}
					if (accept) {
						await prisma.chatConnection.update({ where: { id: cId }, data: { status: 'accepted' } });
						const msg = await prisma.chatMessage.create({
							data: {
								connectionId: cId,
								senderId: null,
								kind: 'system',
								content: `Request accepted by ${connection.recipient.name}`
							}
						});
						emitToUser(connection.initiatorId, 'chat-accepted', {
							connectionId: cId,
							byUser: { id: connection.recipient.id, name: connection.recipient.name }
						});
						emitToUser(connection.initiatorId, 'chat-message', msg);
						emitToUser(connection.recipientId, 'chat-message', msg);
						return;
					}
					await prisma.chatConnection.update({ where: { id: cId }, data: { status: 'rejected' } });
					const msg = await prisma.chatMessage.create({
						data: {
							connectionId: cId,
							senderId: null,
							kind: 'system',
							content: `Request rejected by ${connection.recipient.name}`
						}
					});
					emitToUser(connection.initiatorId, 'chat-rejected', {
						connectionId: cId,
						byUser: { id: connection.recipient.id, name: connection.recipient.name }
					});
					emitToUser(connection.initiatorId, 'chat-message', msg);
					emitToUser(connection.recipientId, 'chat-message', msg);
				}
			);
			socket.on('chat-end', async ({ connectionId, userId }: { connectionId: string; userId: string }) => {
				const authedUserId = String(socket.data.userId ?? '').trim();
				const payloadUserId = String(userId ?? '').trim();
				const id = authedUserId;
				const cId = String(connectionId ?? '').trim();
				if (!id || !cId) {
					return;
				}
				if (payloadUserId && payloadUserId !== authedUserId) {
					return;
				}
				const connection = await prisma.chatConnection.findUnique({
					where: { id: cId },
					select: { id: true, initiatorId: true, recipientId: true, status: true }
				});
				if (!connection) {
					return;
				}
				if (connection.initiatorId !== id && connection.recipientId !== id) {
					return;
				}
				if (connection.status === 'ended' || connection.status === 'rejected') {
					return;
				}
				const actor = await prisma.user.findUnique({ where: { id }, select: { name: true } });
				const actorName = actor?.name ?? 'User';
				await endConnectionAndNotify(prisma, {
					connectionId: cId,
					systemMessage: `${actorName} ended the chat`
				});
			});
			socket.on('chat-join', async () => {
				const authedUserId = String(socket.data.userId ?? '').trim();
				if (!authedUserId) {
					return;
				}
			});
			socket.on(
				'chat-message',
				async ({
					connectionId,
					senderId,
					content
				}: {
					connectionId: string;
					senderId: string;
					content: string;
				}) => {
					const authedUserId = String(socket.data.userId ?? '').trim();
					const cId = String(connectionId ?? '').trim();
					const payloadSenderId = String(senderId ?? '').trim();
					const sId = authedUserId;
					const text = String(content ?? '');
					if (!cId || !sId) {
						return;
					}
					if (payloadSenderId && payloadSenderId !== authedUserId) {
						return;
					}
					if (Buffer.byteLength(text, 'utf8') > 65536) {
						return;
					}
					const connection = await prisma.chatConnection.findUnique({ where: { id: cId } });
					if (!connection) {
						return;
					}
					if (connection.status !== 'accepted') {
						return;
					}
					if (connection.initiatorId !== sId && connection.recipientId !== sId) {
						return;
					}
					const msg = await prisma.chatMessage.create({
						data: { connectionId: cId, senderId: sId, kind: 'user', content: text }
					});
					emitToUser(connection.initiatorId, 'chat-message', msg);
					emitToUser(connection.recipientId, 'chat-message', msg);
				}
			);
			socket.on('chat-leave', async () => {
				const authedUserId = String(socket.data.userId ?? '').trim();
				if (!authedUserId) {
					return;
				}
			});
			socket.on('disconnect', async () => {
				const userId = socket.data.userId;
				if (!userId) {
					return;
				}
				removeSocket(userId, socket.id);
			});
		});
		setInterval(() => {
			endInactiveChats(prisma).catch((e) => console.error('endInactiveChats failed', e));
		}, 60 * 1000);
	}
	return {
		realtime: { isUserOnline, emitToUser } satisfies Realtime,
		registerHandlers
	};
}
