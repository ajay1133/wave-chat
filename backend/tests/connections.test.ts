import { describe, expect, it, vi } from 'vitest';
import { postConnections } from '../routes/connections';
import { createStore } from '../store';
import { createMockReq, createMockRes } from './mockHttp';

describe('connections routes', () => {
	it('POST /connections creates a pending connection (auth via x-user-id)', async () => {
		const store = createStore();
		const realtime = {
			emitToUser: vi.fn(),
			isUserOnline: vi.fn(() => false)
		};
		const handler = postConnections({ store, realtime });
		const req = createMockReq({
			body: { 
                initiatorId: 'userId1', 
                recipientId: 'userId2' 
            },
			header: (name: string) => (name.toLowerCase() === 'x-user-id' ? 'userId1' : undefined)
		});
		const res = createMockRes();
		await handler(req, res);
		expect(res.statusCode ?? 200).toBe(200);
		expect(res.jsonBody.status).toBe('pending');
		expect(typeof res.jsonBody.connectionId).toBe('string');
		expect(realtime.emitToUser).toHaveBeenCalled();
		expect(realtime.isUserOnline).toHaveBeenCalledWith('userId2');
	});
});
