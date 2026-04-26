import express from 'express';
import type { Request, Response } from 'express';
import type {
	ConnectionParams,
	ErrorResponse,
	GetConnectionResponse,
	GetMessagesQuery,
	GetMessagesResponse,
	PostConnectionsRequestBody,
	PostConnectionsResponse
} from '../types';

export function getAuthedUserId(store: any, req: Request, res: Response<ErrorResponse>) {
	const id = req.header('x-user-id');
	if (!id) {
		res.status(401).json({ error: 'Error x-user-id is missing' });
		return null;
	}
	const user = store.users.getById(id);
	if (!user) {
		res.status(401).json({ error: 'Error user not found' });
		return null;
	}
	return id;
}

export function postConnections({ store, realtime }: { store: any, realtime: any }) {
	return async (
		req: Request<{}, PostConnectionsResponse | ErrorResponse, PostConnectionsRequestBody>,
		res: Response<PostConnectionsResponse | ErrorResponse>
	) => {
		const authedUserId = getAuthedUserId(store, req, res as Response<ErrorResponse>);
		if (!authedUserId) {
			return;
		}
		const { initiatorId, recipientId } = req.body;
		if (!initiatorId || !recipientId) {
			res.status(400).json({ error: 'Error initiatorId or recipientId is missing' });
			return;
		}
		if (initiatorId !== authedUserId) {
			res.status(403).json({ error: 'Error initiatorId does not match with current user' });
			return;
		}
		if (initiatorId === recipientId) {
			res.status(400).json({ error: 'Error user attempting to chat with himself' });
			return;
		}
		const initiator = store.users.getById(initiatorId);
		const recipient = store.users.getById(recipientId);
		if (!initiator) {
			res.status(404).json({ error: 'Error initiator not found' });
			return;
		}
		if (!recipient) {
			res.status(404).json({ error: 'Error recipient not found' });
			return;
		}
		const connection = store.chats.createConnection({ initiatorId, recipientId });
		const requestMsg = store.chats.createMessage({
			connectionId: connection.id,
			senderId: null,
			kind: 'system',
			content: `Request sent to ${recipient.name}`
		});
		realtime.emitToUser(initiatorId, 'chat-message', requestMsg);
		if (realtime.isUserOnline(recipientId)) {
			realtime.emitToUser(recipientId, 'chat-incoming', {
				connectionId: connection.id,
				fromUser: {
					id: initiator.id,
					name: initiator.name
				}
			});
		}
		res.json({
			connectionId: connection.id,
			status: connection.status
		});
	};
}

export function getConnectionById({ store }: { store: any }) {
	return async (
		req: Request<ConnectionParams, GetConnectionResponse | ErrorResponse>,
		res: Response<GetConnectionResponse | ErrorResponse>
	) => {
		const authedUserId = getAuthedUserId(store, req, res as Response<ErrorResponse>);
		if (!authedUserId) {
			return;
		}
		const { connectionId } = req.params;
		const connection = store.chats.getConnectionById(connectionId);
		if (!connection) {
			res.status(404).json({ error: 'Error connection not found' });
			return;
		}
		if (connection.initiatorId !== authedUserId && connection.recipientId !== authedUserId) {
			res.status(403).json({ error: 'Error forbidden' });
			return;
		}
		const initiator = store.users.getById(connection.initiatorId);
		const recipient = store.users.getById(connection.recipientId);
		if (!initiator || !recipient) {
			res.status(500).json({ error: 'Error connection users not found' });
			return;
		}
		res.json({
			id: connection.id,
			status: connection.status,
			initiator: { id: initiator.id, email: initiator.email, name: initiator.name, onlineStatus: initiator.onlineStatus },
			recipient: { id: recipient.id, email: recipient.email, name: recipient.name, onlineStatus: recipient.onlineStatus },
			initiatorId: connection.initiatorId,
			recipientId: connection.recipientId
		});
	};
}

export function getMessagesByConnectionId({ store }: { store: any }) {
	return async (
		req: Request<ConnectionParams, GetMessagesResponse | ErrorResponse, {}, GetMessagesQuery>,
		res: Response<GetMessagesResponse | ErrorResponse>
	) => {
		const authedUserId = getAuthedUserId(store, req, res as Response<ErrorResponse>);
		if (!authedUserId) {
			return;
		}
		const { connectionId } = req.params;
		const conn = store.chats.getConnectionById(connectionId);
		if (!conn) {
			res.status(404).json({ error: 'Error connection not found' });
			return;
		}
		if (conn.initiatorId !== authedUserId && conn.recipientId !== authedUserId) {
			res.status(403).json({ error: 'Error forbidden' });
			return;
		}
		const limit = req.query.limit === undefined ? null : Number(req.query.limit);
		const before = req.query.before ? new Date(String(req.query.before)) : null;
		const messages = store.chats.getMessagesByConnectionId({ connectionId, before, limit });
		res.json({
			messages
		});
	};
}

export function connectionRoutes({ store, realtime }: { store: any, realtime: any }) {
	const router = express.Router();
	router.post('/connections', postConnections({ store, realtime }));
	router.get('/connections/:connectionId', getConnectionById({ store }));
	router.get('/connections/:connectionId/messages', getMessagesByConnectionId({ store }));
	return router;
}
