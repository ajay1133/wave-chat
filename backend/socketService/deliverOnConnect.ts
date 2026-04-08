export function deliverOnConnect(params: { socket: any; userId: string; store: any }) {
	const { socket, userId, store } = params;

	const pending = store.chats.listPendingConnectionsForRecipient(userId);
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

	const fallbackWindowMs = 7 * 24 * 60 * 60 * 1000; // 1 week
	const cutoff = new Date(Date.now() - fallbackWindowMs);
	const changed = store.chats.listConnectionsChangedForInitiator({
		initiatorId: userId,
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
