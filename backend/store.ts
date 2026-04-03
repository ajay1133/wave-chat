import { randomBytes } from 'crypto';

const newId = () => randomBytes(12).toString('hex');

const toPublicUser = (user) => {
	const { id, email, name } = user ?? {};
	return { id, email, name };
};

const getUsrJson = () => {
	try {
		const usersJsonList = require('./default-users.json') ?? [];
		return usersJsonList;
	} catch {
		return [];
	}
};

const usersList = (defaultUsersRaw) => {
	const usersById = new Map();
	const usersByEmail = new Map();
	for (const u of defaultUsersRaw ?? []) {
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

const crUsrGetId = (usersById) => (id) => usersById.get(id) ?? null;

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
	getById: crUsrGetId(usersById),
	getByEmail: crUsrGetEmail(usersByEmail),
	search: crUsrSearch(usersById)
});

const addMsgToConnIdx = (messageIdsByConnectionId) => (msg) => {
	const list = messageIdsByConnectionId.get(msg.connectionId) ?? [];
	list.push(msg.id);
	messageIdsByConnectionId.set(msg.connectionId, list);
};

const crChatConn = (connectionsById) => ({ initiatorId, recipientId }) => {
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

const crChatGetConn = (connectionsById) => (id) => {
	return connectionsById.get(id) ?? null;
};

const crChatPendRecp = (connectionsById) => (recipientId) => {
	const res = [];
	for (const c of connectionsById.values()) {
		if (c.recipientId === recipientId && c.status === 'pending') {
			res.push(c);
		}
	}
	res.sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
	return res;
};

const crChatChgInit = (connectionsById) => ({ initiatorId, since, statuses, take }) => {
	const limit = Number.isFinite(take) ? Math.min(200, take) : 50;
	const allowed = new Set(Array.isArray(statuses) ? statuses : []);
	const res = [];
	for (const c of connectionsById.values()) {
		if (c.initiatorId !== initiatorId || allowed.has(c.status) || c?.updatedAt?.getTime() <= since?.getTime()) {
			continue;
		}
		res.push(c);
	}
	res.sort((a, b) => a.updatedAt.getTime() - b.updatedAt.getTime());
	return res.slice(0, limit);
};

const crChatSetStat = (connectionsById) => ({ connectionId, status }) => {
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

const crChatNewMsg = (messagesById, addMsgToConnIdx) => ({ connectionId, senderId, kind, content }) => {
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

const crChatGetMsgs = (messagesById, messageIdsByConnectionId) => ({ connectionId, before, limit }) => {
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

const crChatAcptConns = (connectionsById) => () => {
	const res = [];
	for (const c of connectionsById.values()) {
		if (c.status === 'accepted') {
			res.push(c);
		}
	}
	return res;
};

const crChatLastAct = (connectionsById, messagesById, messageIdsByConnectionId) => (connectionId) => {
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
		createConnection: crChatConn(connectionsById),
		getConnectionById: crChatGetConn(connectionsById),
		listPendingForRecipient: crChatPendRecp(connectionsById),
		listChangedForInitiator: crChatChgInit(connectionsById),
		updateConnectionStatus: crChatSetStat(connectionsById),
		createMessage: crChatNewMsg(messagesById, addMsgToConnIndex),
		getMessages: crChatGetMsgs(messagesById, messageIdsByConnectionId),
		listAcceptedConnections: crChatAcptConns(connectionsById),
		getLastActivityAt: crChatLastAct(connectionsById, messagesById, messageIdsByConnectionId)
	};
};

export const mkStore = () => {
	const { usersById, usersByEmail } = usersList(getUsrJson());
	const connectionsById = new Map();
	const messagesById = new Map();
	const messageIdsByConnectionId = new Map();
	return {
		users: mkUsr(usersById, usersByEmail),
		chats: mkChat(connectionsById, messagesById, messageIdsByConnectionId)
	};
};
