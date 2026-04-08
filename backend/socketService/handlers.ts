import { createOnConnectionHandler } from './onConnectionHandler';

export function registerHandlers(params: {
	io: any;
	store: any;
	addSocket: (userId: string, socketId: string) => void;
	removeSocket: (userId: string, socketId: string) => void;
	emitToUser: (userId: string, event: string, payload: any) => void;
}) {
	const { io, store, addSocket, removeSocket, emitToUser } = params;
	io.on('connection', createOnConnectionHandler({ store, addSocket, removeSocket, emitToUser }));
}
