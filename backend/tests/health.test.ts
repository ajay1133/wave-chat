import { describe, expect, it } from 'vitest';
import { getHealth } from '../routes/health';
import { createMockReq, createMockRes } from './mockHttp';

describe('health routes', () => {
	it('GET /health', async () => {
		const req = createMockReq();
		const res = createMockRes();
		await getHealth(req, res);
		expect(res.statusCode ?? 200).toBe(200);
		expect(res.jsonBody).toEqual({ ok: true });
	});
});
