import { createApp } from './app';

const CONFIG_MOD = require('./config');
const CONFIG = CONFIG_MOD.default ?? CONFIG_MOD;

const { httpServer } = createApp();

httpServer.listen(CONFIG.PORT, () => {
	console.log(`Server listening on *:${CONFIG.PORT} 🚀`);
});
