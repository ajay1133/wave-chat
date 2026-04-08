import { endConnectionAndNotify } from './connectionLifecycle';

const CHAT_INACTIVITY_MS = 60 * 60 * 1000;

export function startInactivityLoop(params: {
	store: any;
	emitToUser: (userId: string, event: string, payload: any) => void;
}) {
	const { store, emitToUser } = params;

	function endInactiveChats() {
		const cutoff = new Date(Date.now() - CHAT_INACTIVITY_MS);
		const candidates = store.chats.listAcceptedConnections();
		for (const c of candidates) {
			const lastActivityAt = store.chats.getLastActivityAtForConnection(c.id) ?? c.createdAt;
			if (lastActivityAt > cutoff) {
				continue;
			}
			endConnectionAndNotify({
				connectionId: c.id,
				systemMessage: 'Chat ended due to inactivity.',
				store,
				emitToUser
			});
		}
	}

	setInterval(() => {
		try {
			endInactiveChats();
		} catch (e) {
			console.error('Ending inactive chats failed, error = ', e);
		}
	}, 60 * 1000);
}
