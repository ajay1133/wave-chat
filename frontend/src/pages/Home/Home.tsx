import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router';
import { Alert, Button, Container } from '@mui/material';
import { mkConn, searchUsers } from '../../api';
import type { User } from '../../types';
import { clearUser, getUser } from '../../auth';
import './Home.css';

export default function Home() {
  const navigate = useNavigate();
  const [currentUser] = useState(() => getUser());
  const [query, setQuery] = useState('');
  const [matches, setMatches] = useState<User[]>([]);
  const [info, setInfo] = useState<string>('');
  const searchRequestId = useRef(0);

  function toErrorMessage(err: any) {
    return String(err?.message ?? err ?? '');
  }

  function handleLogoutClick() {
    clearUser();
    navigate('/login', { replace: true });
  }

  function handleQueryChange(e: any) {
    setQuery(e.target.value);
  }

  function handleStartNewChatClick() {
    setInfo('');
    setQuery('');
    setMatches([]);
  }

  useEffect(() => {
    if (!currentUser) {
      navigate('/login', { replace: true });
      return;
    }
  }, [currentUser, navigate]);

  useEffect(() => {
    if (!currentUser) {
      return;
    }
    const q = query;
    if (!q) {
      setMatches([]);
      return;
    }
    const requestId = searchRequestId.current + 1;
    searchRequestId.current = requestId;
    const runSearch = async () => {
      try {
        const res = await searchUsers(q, currentUser.id, 5);
        if (requestId !== searchRequestId.current) {
          return;
        }
        setMatches(res.users);
      } catch {
        if (requestId !== searchRequestId.current) {
          return;
        }
        setMatches([]);
      }
    };
    const handle = window.setTimeout(() => {
      runSearch();
    }, 300);
    return () => {
      window.clearTimeout(handle);
    };
  }, [currentUser, query]);

  async function startChat(other: User) {
    if (!currentUser) {
      return;
    }
    setInfo('');
    try {
      const { connectionId } = await mkConn(currentUser.id, other.id);
      const url = `/chat/${connectionId}`;
      window.open(url, '_blank', 'noopener,noreferrer');
    } catch (e) {
      console.log(e);
      setInfo(toErrorMessage(e));
    }
  }

  function handleSuggestionClick(e: any) {
    const userId = e.currentTarget.dataset.userId;
    if (!userId) {
      return;
    }
    const other = matches.find((u) => u.id === userId);
    if (!other) {
      return;
    }
    setQuery('');
    setMatches([]);
    startChat(other);
  }

  return (
    <div className="homePage">
      <Container maxWidth="sm">
        <div className="homeCard">
          <div className="homeHeader">
            <div>
              <div className="homeTitle">Wave Chat</div>
              {currentUser ? <div className="homeSubtitle">{currentUser.name}</div> : null}
            </div>

            <Button variant="text" onClick={handleLogoutClick}>
              Logout
            </Button>
          </div>

          <div>
            <div className="homeSearchBlock">
              <div className="homeSearchField">
                <label className="homeLabel">
                  Search name or email
                  <input
                    className="homeInput"
                    value={query}
                    onChange={handleQueryChange}
                    placeholder="Type a user id, name or email"
                  />
                </label>

                {matches.length > 0 ? (
                  <div className="homeSuggestions">
                    {matches.map((u) => (
                      <button
                        key={u.id}
                        className="homeSuggestion"
                        type="button"
                        data-user-id={u.id}
                        onClick={handleSuggestionClick}
                      >
                        {u.name} ({u.email})
                      </button>
                    ))}
                  </div>
                ) : null}
              </div>

              <Button variant="contained" onClick={handleStartNewChatClick}>
                Start new chat
              </Button>

              {!matches.length && query ? <div className="homeHint">No suggestions.</div> : null}
            </div>
          </div>

          <Alert severity="info">Allow popups to open the chat tab</Alert>

          {info ? <Alert severity="error">{info}</Alert> : null}
        </div>
      </Container>
    </div>
  );
}
