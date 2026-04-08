import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('socket.io-client', () => {
  const socket = {
    connected: false,
    on: () => {},
    off: () => {},
    emit: () => {},
    connect: () => {
      socket.connected = true;
    },
    disconnect: () => {
      socket.connected = false;
    }
  };
  return { io: vi.fn(() => socket) };
});

import Routes from '../pages';

beforeEach(() => {
  localStorage.removeItem('wave-chat-user');
});

describe('Routes wrapper', () => {
  it('renders', () => {
    render(<Routes />);
    expect(screen.getByText('Wave Chat')).toBeTruthy();
  });
});
