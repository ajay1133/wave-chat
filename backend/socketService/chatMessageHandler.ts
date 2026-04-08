import { getSocketUserId } from './socketUtils';

export function createChatMessageHandler(params: {
	socket: any;
	store: any;
	emitToUser: (userId: string, event: string, payload: any) => void;
}) {
	const { socket, store, emitToUser } = params;

	return async (payload: any) => {
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
	};
}
