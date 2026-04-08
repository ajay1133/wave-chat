import { getSocketUserId } from './socketUtils';

export function createChatRespondHandler(params: {
	socket: any;
	store: any;
	emitToUser: (userId: string, event: string, payload: any) => void;
}) {
	const { socket, store, emitToUser } = params;

	return async (payload: any) => {
		const cId = payload.connectionId;
		const accept = Boolean(payload.accept);
		const id = getSocketUserId(socket);
		if (!id || !cId) {
			return;
		}
		const payloadUserId = payload.userId;
		if (payloadUserId && payloadUserId !== id) {
			return;
		}
		const connection = store.chats.getConnectionById(cId);
		if (!connection || connection.recipientId !== id || connection.status !== 'pending') {
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
	};
}
