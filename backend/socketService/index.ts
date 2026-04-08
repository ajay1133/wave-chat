import { createSocketRegistry } from './socketRegistry';
import { startInactivityLoop } from './inactivity';
import { registerHandlers } from './handlers';

export function socketService(io: any, store: any) {
	const registry = createSocketRegistry(io);

	function registerServiceHandlers() {
		registerHandlers({
			io,
			store,
			addSocket: registry.addSocket,
			removeSocket: registry.removeSocket,
			emitToUser: registry.emitToUser
		});
		startInactivityLoop({ store, emitToUser: registry.emitToUser });
	}

	return {
		realtime: { isUserOnline: registry.isUserOnline, emitToUser: registry.emitToUser },
		registerHandlers: registerServiceHandlers
	};
}
