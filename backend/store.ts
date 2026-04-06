import { randomBytes } from 'crypto';

const newId = () => randomBytes(12).toString('hex');

const toPublicUser = (user) => {
	const { id, email, name } = user ?? {};
	return { id, email, name };
};

const getDefaultUsers = () => {
	try {
		const usersJsonList = require('./default-users.json') ?? [];
		return usersJsonList;
	} catch {
		return [];
	}
};

const getUsersList = () => {
	const usersById = new Map();
	const usersByEmail = new Map();
	for (const u of (getDefaultUsers() ?? [])) {
		const { id, email, name, password } = u ?? {};
		if (!id || !email || !name || !password) {
			continue;
		}
		const user = { id, email, name, password };
		usersById.set(id, user);
		usersByEmail.set(email, user);
	}
	return { usersById, usersByEmail };
};

const getUsers = (usersById) => (id) => usersById.get(id) ?? null;

const crUsrGetEmail = (usersByEmail) => (email) => usersByEmail.get(email) ?? null;

const crUsrSearch = (usersById) => ({ query, excludeUserId, take }) => {
	const limit = take ?? 5;
	if (!query) {
		return [];
	}
	const res = [];
	for (const user of usersById.values()) {
		if (excludeUserId && user.id === excludeUserId) {
			continue;
		}
		if (
			user.id.includes(query) || 
			user.email.includes(query) || 
			user.name.includes(query)
		) {
			res.push(toPublicUser(user));
		}
		if (res.length >= limit) {
			break;
		}
	}
	return res;
};

const mkUsr = (usersById, usersByEmail) => ({
	getById: getUsers(usersById),
	getByEmail: crUsrGetEmail(usersByEmail),
	search: crUsrSearch(usersById)
});

const addMsgToConnIdx = (messageIdsByConnectionId) => (msg) => {
	const list = messageIdsByConnectionId.get(msg.connectionId) ?? [];
	list.push(msg.id);
	messageIdsByConnectionId.set(msg.connectionId, list);
};

const mkChatConn = (connectionsById) => ({ initiatorId, recipientId }) => {
	const now = new Date();
	const data = {
		id: newId(),
		initiatorId,
		recipientId,
		status: 'pending',
		createdAt: now,
		updatedAt: now
	};
	connectionsById.set(data.id, data);
	return data;
};

const getChatConn = (connectionsById) => (id) => {
	return connectionsById.get(id) ?? null;
};

const getPendingRepList = (connectionsById) => (recipientId) => {
	const res = [];
	for (const c of connectionsById.values()) {
		if (c.recipientId === recipientId && c.status === 'pending') {
			res.push(c);
		}
	}
	res.sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
	return res;
};

const getChangedInitList = (connectionsById) => ({ initiatorId, since, statuses, take }) => {
	const limit = Number.isFinite(take) ? Math.min(200, take) : 50;
	const excStatuses = new Set(Array.isArray(statuses) ? statuses : []);
	const res = [];
	for (const c of connectionsById.values()) {
		if (
			c.initiatorId !== initiatorId || 
			excStatuses.has(c.status) || 
			c.updatedAt?.getTime() <= since?.getTime()
		) {
			continue;
		}
		res.push(c);
	}
	res.sort((a, b) => a.updatedAt.getTime() - b.updatedAt.getTime());
	return res.slice(0, limit);
};

const updConnStatus = (connectionsById) => ({ connectionId, status }) => {
	const c = connectionsById.get(connectionId);
	if (!c) {
		return null;
	}
	if (c.status !== status) {
		c.status = status;
		c.updatedAt = new Date();
	}
	return c;
};

const mkChatMsg = (messagesById, addMsgToConnIdx) => ({ connectionId, senderId, kind, content }) => {
	const msg = {
		id: newId(),
		connectionId,
		senderId,
		kind,
		content,
		createdAt: new Date()
	};
	messagesById.set(msg.id, msg);
	addMsgToConnIdx(msg);
	return msg;
};

const getChatMsgs = (messagesById, messageIdsByConnectionId) => ({ connectionId, before, limit }) => {
	const ids = messageIdsByConnectionId.get(connectionId) ?? [];
	const res = [];
	for (const id of ids) {
		const m = messagesById.get(id);
		if (!m) {
			continue;
		}
		if (before && m.createdAt.getTime() >= before.getTime()) {
			continue;
		}
		res.push(m);
	}
	res.sort((a, b) => {
		const d = b.createdAt.getTime() - a.createdAt.getTime();
		return d !== 0 ? d : b.id.localeCompare(a.id);
	});
	const sliced = typeof limit === 'number' && Number.isFinite(limit) 
		? res.slice(0, limit) : res;
	return sliced.reverse();
};

const getAcptConns = (connectionsById) => () => {
	const res = [];
	for (const c of connectionsById.values()) {
		if (c.status === 'accepted') {
			res.push(c);
		}
	}
	return res;
};

const getChatLastAct = (connectionsById, messagesById, messageIdsByConnectionId) => (connectionId) => {
	const c = connectionsById.get(connectionId);
	if (!c) {
		return null;
	}
	const ids = messageIdsByConnectionId.get(connectionId) ?? [];
	let best = null;
	for (const id of ids) {
		const m = messagesById.get(id);
		if (!m) {
			continue;
		}
		if (!best || m.createdAt.getTime() > best.getTime()) {
			best = m.createdAt;
		}
	}
	return best ?? c.createdAt;
};

const mkChat = (connectionsById, messagesById, messageIdsByConnectionId) => {
	const addMsgToConnIndex = addMsgToConnIdx(messageIdsByConnectionId);
	return {
		createConnection: mkChatConn(connectionsById),
		getConnectionById: getChatConn(connectionsById),
		listPendingForRecipient: getPendingRepList(connectionsById),
		listChangedForInitiator: getChangedInitList(connectionsById),
		updateConnectionStatus: updConnStatus(connectionsById),
		createMessage: mkChatMsg(messagesById, addMsgToConnIndex),
		getMessages: getChatMsgs(messagesById, messageIdsByConnectionId),
		listAcceptedConnections: getAcptConns(connectionsById),
		getLastActivityAt: getChatLastAct(connectionsById, messagesById, messageIdsByConnectionId)
	};
};

export const mkStore = () => {
	const { usersById, usersByEmail } = getUsersList();
	const connectionsById = new Map();
	const messagesById = new Map();
	const messageIdsByConnectionId = new Map();
	return {
		users: mkUsr(usersById, usersByEmail),
		chats: mkChat(connectionsById, messagesById, messageIdsByConnectionId)
	};
};
