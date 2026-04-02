import { describe, expect, it, vi } from 'vitest';

import { customRouteWrapper } from './customRouteWrapper';

describe('http/customRouteWrapper', () => {
	it('runs the handler', async () => {
		const handler = vi.fn(async () => undefined);
		const wrapped = customRouteWrapper(handler as any);

		const req = { method: 'GET', path: '/x' } as any;
		const res = {
			headersSent: false,
			status: vi.fn(function status() {
				return res;
			}),
			json: vi.fn(function json() {
				return res;
			})
		} as any;

		wrapped(req, res);
		await Promise.resolve();

		expect(handler).toHaveBeenCalledTimes(1);
		expect(res.status).not.toHaveBeenCalled();
		expect(res.json).not.toHaveBeenCalled();
	});

	it('returns 500 when handler throws', async () => {
		const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => undefined);
		const handler = vi.fn(async () => {
			throw new Error('boom');
		});
		const wrapped = customRouteWrapper(handler as any);

		const req = { method: 'GET', path: '/x' } as any;
		const res = {
			headersSent: false,
			status: vi.fn(function status() {
				return res;
			}),
			json: vi.fn(function json() {
				return res;
			})
		} as any;

		wrapped(req, res);
		await Promise.resolve();

		expect(res.status).toHaveBeenCalledWith(500);
		expect(res.json).toHaveBeenCalledWith({ error: 'internal error: boom' });

		errorSpy.mockRestore();
	});

	it('does nothing if headers already sent', async () => {
		const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => undefined);
		const handler = vi.fn(async () => {
			throw new Error('boom');
		});
		const wrapped = customRouteWrapper(handler as any);

		const req = { method: 'GET', path: '/x' } as any;
		const res = {
			headersSent: true,
			status: vi.fn(function status() {
				return res;
			}),
			json: vi.fn(function json() {
				return res;
			})
		} as any;

		wrapped(req, res);
		await Promise.resolve();

		expect(res.status).not.toHaveBeenCalled();
		expect(res.json).not.toHaveBeenCalled();

		errorSpy.mockRestore();
	});
});
