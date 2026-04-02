import { BrowserRouter, Routes as RouterRoutes, Route, useLocation } from 'react-router';
import { useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import { Alert, Button, IconButton, Snackbar } from '@mui/material';
import config from '../config';
// Routes
import Chat from './Chat';
import Home from './Home';
import { LoginPage } from './Login';
import { getUser } from '../auth';
import { incrementUnread } from '../unread';

const socket = io(config.SOCKET_ENDPOINT, { transports: ['websocket', 'polling', 'flashsocket'] });
const AUTH_SINCE_KEY = 'wave-chat-auth-since';

function AuthSocketBridge() {
  const location = useLocation();

  useEffect(() => {
    const doAuth = () => {
      const currentUser = getUser();
      if (!currentUser) {
        return;
      }
      const since = localStorage.getItem(AUTH_SINCE_KEY) ?? undefined;
      socket.emit('auth', { userId: currentUser.id, since });
    };

    doAuth();
    socket.on('connect', doAuth);
    return () => {
      socket.off('connect', doAuth);
    };
  }, [location.pathname]);

  useEffect(() => {
    const onDone = ({ serverTime }: { serverTime: string }) => {
      if (!serverTime) {
        return;
      }
      localStorage.setItem(AUTH_SINCE_KEY, serverTime);
    };
    socket.on('auth-done', onDone);
    return () => {
      socket.off('auth-done', onDone);
    };
  }, []);

  return null;
}

function UnreadSocketBridge() {
  const location = useLocation();

  useEffect(() => {
    const onMessage = (msg: { id: string; connectionId: string; senderId: string | null; kind: string }) => {
      const active = location.pathname === `/chat/${msg.connectionId}`;
      if (active) {
        return;
      }
      const currentUser = getUser();
      if (currentUser && msg.senderId === currentUser.id) {
        return;
      }
      if (msg.kind !== 'user') {
        return;
      }
      incrementUnread(msg.connectionId, msg.id);
    };
    socket.on('chat-message', onMessage);
    return () => {
      socket.off('chat-message', onMessage);
    };
  }, [location.pathname]);
  return null;
}

type IncomingRequest = { connectionId: string; fromUser: { id: string; name: string } };

type StatusNotice = {
  connectionId: string;
  status: 'accepted' | 'rejected';
  byUser?: { id: string; name: string };
};

function IncomingToast({ toast, offset, onDismiss, onRespond }: { toast: IncomingRequest; offset: number; onDismiss: (connectionId: string) => void; onRespond: (connectionId: string, accept: boolean) => void }) {
  function handleClose() {
    onDismiss(toast.connectionId);
  }

  function handleAccept() {
    onRespond(toast.connectionId, true);
  }

  function handleReject() {
    onRespond(toast.connectionId, false);
  }

  return (
    <Snackbar
      key={`incoming-${toast.connectionId}`}
      open
      anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      onClose={handleClose}
      sx={{ bottom: 16 + offset }}
    >
      <Alert
        severity="info"
        action={
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4 }}>
            <IconButton aria-label="Close" size="small" onClick={handleClose}>
              <span style={{ fontSize: 16, lineHeight: 1 }}>
                ×
              </span>
            </IconButton>
            <div style={{ display: 'flex', gap: 8 }}>
              <Button size="small" color="inherit" onClick={handleAccept}>
                Accept
              </Button>
              <Button size="small" color="inherit" onClick={handleReject}>
                Reject
              </Button>
            </div>
          </div>
        }
      >
        Incoming chat request from {toast.fromUser.name}
      </Alert>
    </Snackbar>
  );
}

function StatusToast({ toast, offset, onDismiss, onOpen }: { toast: StatusNotice; offset: number; onDismiss: (connectionId: string, status: StatusNotice['status']) => void; onOpen: (connectionId: string) => void }) {
  function handleClose() {
    onDismiss(toast.connectionId, toast.status);
  }

  function handleOpen() {
    onOpen(toast.connectionId);
  }

  const who = toast.byUser?.name ? ` from ${toast.byUser.name}` : '';
  const text = toast.status === 'accepted' ? `Chat accepted${who}` : `Chat rejected${who}`;

  return (
    <Snackbar
      key={`status-${toast.status}-${toast.connectionId}`}
      open
      anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      onClose={handleClose}
      sx={{ bottom: 16 + offset }}
    >
      <Alert
        severity={toast.status === 'accepted' ? 'success' : 'warning'}
        action={
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4 }}>
            <IconButton aria-label="Close" size="small" onClick={handleClose}>
              <span style={{ fontSize: 16, lineHeight: 1 }}>
                ×
              </span>
            </IconButton>
            {toast.status === 'accepted' ? (
              <div style={{ display: 'flex', gap: 8 }}>
                <Button size="small" color="inherit" onClick={handleOpen}>
                  Open
                </Button>
              </div>
            ) : null}
          </div>
        }
      >
        {text}
      </Alert>
    </Snackbar>
  );
}

function IncomingRequestToasts() {
  const [toasts, setToasts] = useState<IncomingRequest[]>([]);
  const [statusToasts, setStatusToasts] = useState<StatusNotice[]>([]);

  useEffect(() => {
    const onIncoming = (payload: IncomingRequest) => {
      setToasts((prev) => {
        if (prev.some((r) => r.connectionId === payload.connectionId)) {
          return prev;
        }
        return prev.concat(payload);
      });
    };
    socket.on('chat-incoming', onIncoming);
    return () => {
      socket.off('chat-incoming', onIncoming);
    };
  }, []);

  useEffect(() => {
    const onAccepted = (payload: { connectionId: string; byUser?: { id: string; name: string } }) => {
      setStatusToasts((prev) => {
        if (prev.some((x) => x.connectionId === payload.connectionId && x.status === 'accepted')) {
          return prev;
        }
        return prev.concat({ connectionId: payload.connectionId, status: 'accepted', byUser: payload.byUser });
      });
    };

    const onRejected = (payload: { connectionId: string; byUser?: { id: string; name: string } }) => {
      setStatusToasts((prev) => {
        if (prev.some((x) => x.connectionId === payload.connectionId && x.status === 'rejected')) {
          return prev;
        }
        return prev.concat({ connectionId: payload.connectionId, status: 'rejected', byUser: payload.byUser });
      });
    };
    socket.on('chat-accepted', onAccepted);
    socket.on('chat-rejected', onRejected);
    return () => {
      socket.off('chat-accepted', onAccepted);
      socket.off('chat-rejected', onRejected);
    };
  }, []);

  function dismiss(connectionId: string) {
    setToasts((prev) => prev.filter((r) => r.connectionId !== connectionId));
  }

  function dismissStatus(connectionId: string, status: StatusNotice['status']) {
    setStatusToasts((prev) => prev.filter((x) => !(x.connectionId === connectionId && x.status === status)));
  }

  function respond(connectionId: string, accept: boolean) {
    const currentUser = getUser();
    if (!currentUser) {
      return;
    }
    socket.emit('chat-respond', { connectionId, userId: currentUser.id, accept });
    dismiss(connectionId);
    if (accept) {
      window.open(`/chat/${connectionId}`, '_blank', 'noopener,noreferrer');
    }
  }

  function openChat(connectionId: string) {
    window.open(`/chat/${connectionId}`, '_blank', 'noopener,noreferrer');
  }

  function openAcceptedChat(connectionId: string) {
    dismissStatus(connectionId, 'accepted');
    openChat(connectionId);
  }

  return (
    <>
      {[...toasts.map((t) => ({ kind: 'incoming' as const, t })), ...statusToasts.map((t) => ({ kind: 'status' as const, t }))].map(
        (item, idx, all) => {
        const offset = (all.length - 1 - idx) * 76;
        if (item.kind === 'incoming') {
          return <IncomingToast toast={item.t} offset={offset} onDismiss={dismiss} onRespond={respond} />;
        }

        return <StatusToast toast={item.t} offset={offset} onDismiss={dismissStatus} onOpen={openAcceptedChat} />;
      })}
    </>
  );
}

export default function Routes() {
  return (
    <BrowserRouter>
      <AuthSocketBridge />
      <UnreadSocketBridge />
      <IncomingRequestToasts />
      <RouterRoutes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/" element={<Home />} />
        <Route path="/chat/:connectionId" element={<Chat socket={socket} />} />
      </RouterRoutes>
    </BrowserRouter>
  );
}
