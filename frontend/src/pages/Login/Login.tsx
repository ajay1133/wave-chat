import { useState } from 'react';
import { Alert, Button, Container } from '@mui/material';
import { useNavigate } from 'react-router';
import { login } from '../../api';
import { setUser } from '../../auth';

import './Login.css';

export function LoginPage() {
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [info, setInfo] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const canSubmit = email.trim().length > 0 && password.length > 0 && !loading;

  function handleEmailChange(e: any) {
    setEmail(e.target.value);
  }

  function handlePasswordChange(e: any) {
    setPassword(e.target.value);
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setInfo(null);
    setLoading(true);
    try {
      const user = await login(email.trim(), password);
      setUser(user);
      navigate('/', { replace: true });
    } catch (err: any) {
      setInfo(err?.message ?? 'Login failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <Container maxWidth="sm" className="loginPage">
      <h1 className="loginTitle">Wave Chat</h1>
      <p className="loginSubtitle">Sign in with your email and password.</p>

      <form className="loginForm" onSubmit={onSubmit}>
        <label className="loginLabel">
          Email
          <input
            className="loginInput"
            value={email}
            onChange={handleEmailChange}
            autoComplete="email"
            inputMode="email"
            placeholder="you@example.com"
          />
        </label>

        <label className="loginLabel">
          Password
          <input
            className="loginInput"
            type="password"
            value={password}
            onChange={handlePasswordChange}
            autoComplete="current-password"
            placeholder="••••••••"
          />
        </label>

        {info ? <Alert severity="error">{info}</Alert> : null}

        <Button type="submit" variant="contained" disabled={!canSubmit}>
          {loading ? 'Signing in…' : 'Sign in'}
        </Button>
      </form>

    </Container>
  );
}
