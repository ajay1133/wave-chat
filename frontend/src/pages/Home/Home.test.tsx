import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { vi } from 'vitest';
import Home from './Home';

describe('pages/Home', () => {
	it('renders', async () => {
		localStorage.setItem('wave-chat-user', JSON.stringify({ id: 'u1', name: 'Me', email: 'me@example.com' }));
		const fetchMock = vi.fn(async () =>
			new Response(
				JSON.stringify({ contacts: [] }), 
				{ 
					status: 200, 
					headers: { 'Content-Type': 'application/json' } 
				}
			)
		);
		vi.stubGlobal('fetch', fetchMock as any);
		render(
			<MemoryRouter>
				<Home />
			</MemoryRouter>
		);
		expect(await screen.findByText('Wave Chat')).toBeTruthy();
		expect(await screen.findByText('Start new chat')).toBeTruthy();
	});
});
