import { render, screen } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router';
import { vi } from 'vitest';

import Chat from './Chat';
import { setUser } from '../../auth';

describe('pages/Chat', () => {
	it('renders', async () => {
		setUser({ id: 'u1', name: 'Me', email: 'me@example.com' });
		const fetchMock = vi.fn(async (input: RequestInfo | URL) => {
			const url = String(input);
			if (url.includes('/connections/c1/messages')) {
				return new Response(
					JSON.stringify({
						messages: [
							{
								id: 'm1',
								connectionId: 'c1',
								senderId: null,
								kind: 'system',
								content: 'Request sent to Other',
								createdAt: new Date().toISOString()
							}
						]
					}),
					{ status: 200, headers: { 'Content-Type': 'application/json' } }
				);
			}
			if (url.includes('/connections/c1')) {
				return new Response(
					JSON.stringify({
						id: 'c1',
						status: 'accepted',
						initiatorId: 'u1',
						recipientId: 'u2',
						initiator: { id: 'u1', name: 'Me', email: 'me@example.com' },
						recipient: { id: 'u2', name: 'Other', email: 'other@example.com' }
					}),
					{ status: 200, headers: { 'Content-Type': 'application/json' } }
				);
			}
			return new Response(JSON.stringify({}), { status: 200, headers: { 'Content-Type': 'application/json' } });
		});

		vi.stubGlobal(
			'fetch',
			fetchMock as any
		);

		const socket = { on: () => socket, off: () => socket, emit: () => undefined } as any;

		render(
			<MemoryRouter initialEntries={['/chat/c1']}>
				<Routes>
					<Route path="/login" element={<div>Login</div>} />
					<Route path="/chat/:connectionId" element={<Chat socket={socket} />} />
				</Routes>
			</MemoryRouter>
		);

		expect(await screen.findByText(/Chat with Other/)).toBeTruthy();
	});
});
