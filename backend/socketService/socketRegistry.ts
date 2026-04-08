export function createSocketRegistry(io: any) {
	const socketsByUserId = new Map<string, Set<string>>();

	function addSocket(userId: string, socketId: string) {
		const set = socketsByUserId.get(userId) ?? new Set<string>();
		set.add(socketId);
		socketsByUserId.set(userId, set);
	}

	function removeSocket(userId: string, socketId: string) {
		const set = socketsByUserId.get(userId);
		if (!set) {
			return;
		}
		set.delete(socketId);
		if (set.size === 0) {
			socketsByUserId.delete(userId);
		}
	}

	function isUserOnline(userId: string) {
		const set = socketsByUserId.get(userId);
		return (set ? set.size : 0) > 0;
	}

	function emitToUser(userId: string, event: string, payload: any) {
		const socketIds = socketsByUserId.get(userId);
		if (!socketIds) {
			return;
		}
		for (const socketId of socketIds) io.to(socketId).emit(event, payload);
	}

	return {
		addSocket,
		removeSocket,
		isUserOnline,
		emitToUser
	};
}
