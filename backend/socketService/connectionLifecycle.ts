export function endConnectionAndNotify(params: {
	connectionId?: string;
	systemMessage: string;
	store: any;
	emitToUser: (userId: string, event: string, payload: any) => void;
}) {
	const { connectionId, systemMessage, store, emitToUser } = params;
	const cId = connectionId;
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
		content: systemMessage
	});
	emitToUser(connection.initiatorId, 'chat-ended', { connectionId: cId });
	emitToUser(connection.recipientId, 'chat-ended', { connectionId: cId });
	emitToUser(connection.initiatorId, 'chat-message', msg);
	emitToUser(connection.recipientId, 'chat-message', msg);
}
