import { deliverOnConnect } from './deliverOnConnect';
import { createChatEndHandler } from './chatEndHandler';
import { createChatMessageHandler } from './chatMessageHandler';
import { createChatRespondHandler } from './chatRespondHandler';
import { createDisconnectHandler } from './disconnectHandler';

export function createOnConnectionHandler(params: {
	store: any;
	addSocket: (userId: string, socketId: string) => void;
	removeSocket: (userId: string, socketId: string) => void;
	emitToUser: (userId: string, event: string, payload: any) => void;
}) {
	const { store, addSocket, removeSocket, emitToUser } = params;

	return (socket: any) => {
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
				deliverOnConnect({ socket, userId: handshakeUserId, store });
			}
		}

		socket.on(
			'chat-respond',
			createChatRespondHandler({
				socket,
				store,
				emitToUser
			})
		);

		socket.on(
			'chat-end',
			createChatEndHandler({
				socket,
				store,
				emitToUser
			})
		);

		socket.on(
			'chat-message',
			createChatMessageHandler({
				socket,
				store,
				emitToUser
			})
		);

		socket.on(
			'disconnect',
			createDisconnectHandler({
				socket,
				removeSocket
			})
		);
	};
}
