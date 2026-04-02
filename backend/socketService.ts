const CHAT_INACTIVITY_MS = 60 * 60 * 1000;

export function socketService(io, store) {
	const socketsByUserId = new Map();

	function addSocket(userId, socketId) {
		const set = socketsByUserId.get(userId) ?? new Set();
		set.add(socketId);
		socketsByUserId.set(userId, set);
	}

	function removeSocket(userId, socketId) {
		const set = socketsByUserId.get(userId);
		if (!set) {
			return;
		}
		set.delete(socketId);
		if (set.size === 0) {
			socketsByUserId.delete(userId);
		}
	}

	function isUserOnline(userId) {
		const set = socketsByUserId.get(userId);
		return (set ? set.size : 0) > 0;
	}

	function emitToUser(userId, event, payload) {
		const socketIds = socketsByUserId.get(userId);
		if (!socketIds) {
			return;
		}
		for (const socketId of socketIds) io.to(socketId).emit(event, payload);
	}

	function deliverOnConnect(socket, id) {
		// If the user was offline when chat requests were created, deliver them now.
		const pending = store.chats.listPendingForRecipient(id);
		for (const c of pending) {
			const initiator = store.users.getById(c.initiatorId);
			if (!initiator) {
				continue;
			}
			socket.emit('chat-incoming', {
				connectionId: c.id,
				fromUser: { id: initiator.id, name: initiator.name }
			});
		}

		const fallbackWindowMs = 7 * 24 * 60 * 60 * 1000;
		const cutoff = new Date(Date.now() - fallbackWindowMs);

		const changed = store.chats.listChangedForInitiator({
			initiatorId: id,
			since: cutoff,
			statuses: ['accepted', 'rejected'],
			take: 50
		});
		for (const c of changed) {
			const recipient = store.users.getById(c.recipientId);
			if (!recipient) {
				continue;
			}
			if (c.status === 'accepted') {
				socket.emit('chat-accepted', {
					connectionId: c.id,
					byUser: { id: recipient.id, name: recipient.name }
				});
			}
			if (c.status === 'rejected') {
				socket.emit('chat-rejected', {
					connectionId: c.id,
					byUser: { id: recipient.id, name: recipient.name }
				});
			}
		}
	}

	function getSocketUserId(socket) {
		return socket.data.userId;
	}

	function endConnectionAndNotify(params) {
		const cId = params.connectionId;
		if (!cId) {
			return;
		}
		const connection = store.chats.getConnectionById(cId);
		if (!connection) {
			return;
		}
		if (connection.status === 'ended' || connection.status === 'rejected') {
			return;
		}
		store.chats.updateConnectionStatus({ connectionId: cId, status: 'ended' });
		const msg = store.chats.createMessage({
			connectionId: cId,
			senderId: null,
			kind: 'system',
			content: params.systemMessage
		});
		emitToUser(connection.initiatorId, 'chat-ended', { connectionId: cId });
		emitToUser(connection.recipientId, 'chat-ended', { connectionId: cId });
		emitToUser(connection.initiatorId, 'chat-message', msg);
		emitToUser(connection.recipientId, 'chat-message', msg);
	}

	function endInactiveChats() {
		const cutoff = new Date(Date.now() - CHAT_INACTIVITY_MS);
		const candidates = store.chats.listAcceptedConnections();
		for (const c of candidates) {
			const lastActivityAt = store.chats.getLastActivityAt(c.id) ?? c.createdAt;
			if (lastActivityAt > cutoff) {
				continue;
			}
			endConnectionAndNotify({
				connectionId: c.id,
				systemMessage: 'Chat ended due to inactivity.'
			});
		}
	}

	function registerHandlers() {
		io.on('connection', (socket) => {
			if (!socket.data) {
				socket.data = {};
			}
			const handshakeAuth = socket.handshake.auth;
			const handshakeUserId = handshakeAuth ? handshakeAuth.userId : undefined;
			if (handshakeUserId) {
				const user = store.users.getById(handshakeUserId);
				if (user) {
					socket.data.userId = handshakeUserId;
					addSocket(handshakeUserId, socket.id);
					deliverOnConnect(socket, handshakeUserId);
				}
			}

			socket.on('chat-respond', async (payload) => {
				const connectionId = payload.connectionId;
				const accept = Boolean(payload.accept);
				const id = getSocketUserId(socket);
				const cId = connectionId;
				if (!id || !cId) {
					return;
				}
				const payloadUserId = payload.userId;
				if (payloadUserId && payloadUserId !== id) {
					return;
				}
				const connection = store.chats.getConnectionById(cId);
				if (!connection) {
					return;
				}
				if (connection.recipientId !== id) {
					return;
				}
				if (connection.status !== 'pending') {
					return;
				}
				const initiator = store.users.getById(connection.initiatorId);
				const recipient = store.users.getById(connection.recipientId);
				if (!initiator || !recipient) {
					return;
				}
				if (accept) {
					store.chats.updateConnectionStatus({ connectionId: cId, status: 'accepted' });
					const msg = store.chats.createMessage({
						connectionId: cId,
						senderId: null,
						kind: 'system',
						content: `Request accepted by ${recipient.name}`
					});
					emitToUser(initiator.id, 'chat-accepted', {
						connectionId: cId,
						byUser: { id: recipient.id, name: recipient.name }
					});
					emitToUser(initiator.id, 'chat-message', msg);
					emitToUser(recipient.id, 'chat-message', msg);
					return;
				}
				store.chats.updateConnectionStatus({ connectionId: cId, status: 'rejected' });
				const msg = store.chats.createMessage({
					connectionId: cId,
					senderId: null,
					kind: 'system',
					content: `Request rejected by ${recipient.name}`
				});
				emitToUser(initiator.id, 'chat-rejected', {
					connectionId: cId,
					byUser: { id: recipient.id, name: recipient.name }
				});
				emitToUser(initiator.id, 'chat-message', msg);
				emitToUser(recipient.id, 'chat-message', msg);
			});
			socket.on('chat-end', async (payload) => {
				const connectionId = payload.connectionId;
				const id = getSocketUserId(socket);
				const cId = connectionId;
				if (!id || !cId) {
					return;
				}
				const payloadUserId = payload.userId;
				if (payloadUserId && payloadUserId !== id) {
					return;
				}
				const connection = store.chats.getConnectionById(cId);
				if (!connection) {
					return;
				}
				if (connection.initiatorId !== id && connection.recipientId !== id) {
					return;
				}
				if (connection.status === 'ended' || connection.status === 'rejected') {
					return;
				}
				const actor = store.users.getById(id);
				const actorName = actor ? actor.name : 'User';
				endConnectionAndNotify({
					connectionId: cId,
					systemMessage: `${actorName} ended the chat`
				});
			});
			socket.on('chat-message', async (payload) => {
				const connectionId = payload.connectionId;
				const content = payload.content;
				const cId = connectionId;
				const sId = getSocketUserId(socket);
				const text = String(content ?? '');
				if (!cId || !sId) {
					return;
				}
				const payloadSenderId = payload.senderId;
				if (payloadSenderId && payloadSenderId !== sId) {
					return;
				}
				if (Buffer.byteLength(text, 'utf8') > 65536) {
					return;
				}
				const connection = store.chats.getConnectionById(cId);
				if (!connection) {
					return;
				}
				if (connection.status !== 'accepted') {
					return;
				}
				if (connection.initiatorId !== sId && connection.recipientId !== sId) {
					return;
				}
				const msg = store.chats.createMessage({
					connectionId: cId,
					senderId: sId,
					kind: 'user',
					content: text
				});
				emitToUser(connection.initiatorId, 'chat-message', msg);
				emitToUser(connection.recipientId, 'chat-message', msg);
			});
			socket.on('disconnect', async () => {
				const userId = getSocketUserId(socket);
				if (!userId) {
					return;
				}
				removeSocket(userId, socket.id);
			});
		});
		setInterval(() => {
			try {
				endInactiveChats();
			} catch (e) {
				console.error('ending inactive chats failed, error = ', e);
			}
		}, 60 * 1000);
	}
	return {
		realtime: { isUserOnline, emitToUser },
		registerHandlers
	};
}
