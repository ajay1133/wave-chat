import { getSocketUserId } from './socketUtils';

export function createDisconnectHandler(params: {
	socket: any;
	removeSocket: (userId: string, socketId: string) => void;
}) {
	const { socket, removeSocket } = params;

	return async () => {
		const userId = getSocketUserId(socket);
		if (!userId) {
			return;
		}
		removeSocket(userId, socket.id);
	};
}
