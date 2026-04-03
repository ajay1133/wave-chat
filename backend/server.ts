import { mkApp } from './app';

const CONFIG_MOD = require('./config');
const CONFIG = CONFIG_MOD.default ?? CONFIG_MOD;

const { httpServer } = mkApp();

httpServer.listen(CONFIG.PORT, () => {
	console.log(`Server listening on *:${CONFIG.PORT} 🚀`);
});
