import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import Chat from '../pages/Chat/Chat';

vi.mock('../api', () => {
  return {
    getConnectionMetadata: vi.fn(async (connectionId: string) => ({
      id: connectionId,
      status: 'accepted',
      initiatorId: demoUser.id,
      recipientId: 'userId2',
      initiator: demoUser,
      recipient: { id: 'userId2', name: 'Test User2', email: 'testUser2@test.com' }
    })),
    getMessagesByConnectionId: vi.fn(async () => ({ messages: [] }))
  };
});

const demoUser = { id: 'userId1', name: 'Test User1', email: 'testUser1@test.com' };

beforeEach(() => {
  localStorage.setItem('wave-chat-user', JSON.stringify(demoUser));
});

describe('Chat page', () => {
  it('renders', async () => {
    const socket = {
      on: vi.fn(),
      off: vi.fn(),
      emit: vi.fn()
    };

    render(
      <MemoryRouter initialEntries={['/chat/c1']}>
        <Routes>
          <Route path="/chat/:connectionId" element={<Chat socket={socket} />} />
        </Routes>
      </MemoryRouter>
    );

    expect(await screen.findByText('Chat with Test User2')).toBeTruthy();
    expect(screen.getByText('End Chat')).toBeTruthy();
    expect(screen.getByText('Send')).toBeTruthy();
  });
});
