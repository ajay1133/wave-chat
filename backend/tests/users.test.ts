import { describe, expect, it } from 'vitest';
import { searchUsers } from '../routes/users';
import { createStore } from '../store';
import { createMockReq, createMockRes } from './mockHttp';

describe('users routes', () => {
	it('GET /users/search returns empty list when query missing', async () => {
		const store = createStore();
		const handler = searchUsers({ store });
		const req = createMockReq({ query: {} });
		const res = createMockRes();
		await handler(req, res);
		expect(res.statusCode ?? 200).toBe(200);
		expect(res.jsonBody).toEqual({ users: [] });
	});
});
