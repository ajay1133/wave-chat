export const loadDefaultUsers = (): any[] => {
	try {
		const usersJsonList = require('../../default-users.json') ?? [];
		return usersJsonList;
	} catch {
		return [];
	}
};
