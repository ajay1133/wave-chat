import { describe, expect, it } from 'vitest';
import { createLoginHandler } from '../routes/auth';
import { createStore } from '../store';
import { createMockReq, createMockRes } from './mockHttp';

describe('auth routes', () => {
	it('POST /auth/login succeeds with default user', async () => {
		const store = createStore();
		const handler = createLoginHandler({ store });
		const req = createMockReq({
			body: { email: 'testUser1@test.com', password: 'testUser1' }
		});
		const res = createMockRes();
		await handler(req, res);
		expect(res.statusCode ?? 200).toBe(200);
		expect(res.jsonBody).toEqual({
			id: 'userId1',
			email: 'testUser1@test.com',
			name: 'Test User1'
		});
	});
});
