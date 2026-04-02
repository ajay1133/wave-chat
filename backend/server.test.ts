import { describe, expect, it } from 'vitest';
import { mkApp } from './app';

const host: string = '127.0.0.1';

function getJson({ port, path }: { port: any; path: any }) {
	return new Promise((resolve, reject) => {
		const http = require('http');
		const reqOptions = {
			host,
			port,
			path,
			method: 'GET'
		};
		const resHandler = (res: any) => {
			let raw = '';
			res.on('data', (c) => {
				raw += String(c ?? '');
			});
			res.on('end', () => {
				let body = null;
				try {
					body = raw ? JSON.parse(raw) : null;
				} catch {
					body = raw;
				}
				resolve({ status: res.statusCode, body });
			});
		};
		const req = http.request(reqOptions, resHandler);
		req.on('error', reject);
		req.end();
	});
}

describe('Server routes', () => {
	it('Checks health route', async () => {
		const { httpServer }: { httpServer: any } = mkApp();
		await new Promise((resolve) => {
			httpServer.listen(0, host, resolve);
		});
		const addr = httpServer.address();
		const port = typeof addr === 'object' && addr ? addr.port : 0;
		const res: any = await getJson({ port, path: '/health' });
		expect(res.status).toBe(200);
		expect(res.body).toEqual({ ok: true });
		await new Promise((resolve, reject) => {
			httpServer.close((err: any) => {
				if (err) {
					reject(err);
					return;
				}
				resolve(undefined);
			});
		});
	});
});
