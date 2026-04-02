import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import Home from './Home';

const demoUser = { id: 'u1', name: 'User1', email: 'user1@example.com' };

describe('Home component', () => {
  it('renders', async () => {
    localStorage.setItem('wave-chat-user', JSON.stringify(demoUser));
    render(
      <MemoryRouter>
        <Home />
      </MemoryRouter>
    );
    expect(await screen.findByText('Wave Chat')).toBeTruthy();
    expect(await screen.findByText('Start new chat')).toBeTruthy();
  });
});
