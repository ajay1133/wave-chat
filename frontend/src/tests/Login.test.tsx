import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router';
import { LoginPage } from '../pages/Login/Login';

describe('Login page', () => {
  it('renders', () => {
    render(
      <MemoryRouter initialEntries={['/login']}>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
        </Routes>
      </MemoryRouter>
    );

    expect(screen.getByText('Wave Chat')).toBeTruthy();
    expect(screen.getByText('Sign in with your email and password.')).toBeTruthy();
  });
});
