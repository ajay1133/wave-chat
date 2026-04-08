export function getSocketUserId(socket: any): string | undefined {
	return socket.data.userId;
}
