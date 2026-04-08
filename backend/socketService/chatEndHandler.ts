import { endConnectionAndNotify } from './connectionLifecycle';
import { getSocketUserId } from './socketUtils';

export function createChatEndHandler(params: {
	socket: any;
	store: any;
	emitToUser: (userId: string, event: string, payload: any) => void;
}) {
	const { socket, store, emitToUser } = params;

	return async (payload: any) => {
		const cId = payload.connectionId;
		const id = getSocketUserId(socket);
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
			systemMessage: `${actorName} ended the chat`,
			store,
			emitToUser
		});
	};
}
