import { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router';
import type { Socket } from 'socket.io-client';
import { Alert, Button, Container } from '@mui/material';
import { getConnectionMeta, getUserMessages, type ChatMessage, type ConnectionMeta } from '../../api';
import { getUser } from '../../auth';
import { clearUnread } from '../../unread';
import './Chat.css';

export default function Chat({ socket }: { socket: Socket }) {
  const navigate = useNavigate();
  const { connectionId } = useParams();
  const [currentUser] = useState(() => getUser());
  const [meta, setUserMeta] = useState<ConnectionMeta | null>(null);
  const [messages, setUserMessages] = useState<ChatMessage[]>([]);
  const [messageText, setUserMessageText] = useState('');
  const [ended, setEnded] = useState(false);
  const [info, setInfo] = useState<string>('');
  const listRef = useRef<HTMLDivElement | null>(null);

  function formatMessageTime(iso: string) {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) {
      return '';
    }
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }

  useEffect(() => {
    if (!currentUser || !connectionId) {
      navigate('/login', { replace: true });
      return;
    }
  }, [connectionId, currentUser, navigate, socket]);

  useEffect(() => {
    if (!currentUser || !connectionId) {
      return;
    }
    clearUnread(connectionId);
  }, [connectionId, currentUser]);

  useEffect(() => {
    setUserMessages([]);
    setUserMessageText('');
    setEnded(false);
    setInfo('');
  }, [connectionId]);

  useEffect(() => {
    if (!currentUser || !connectionId) {
      return;
    }
    const loadMeta = async () => {
      try {
        const m = await getConnectionMeta(connectionId);
        setUserMeta(m);
        if (m.status === 'ended') {
          setEnded(true);
        }
      } catch {
        setUserMeta(null);
      }
    };
    loadMeta();
  }, [connectionId, currentUser]);

  useEffect(() => {
    if (!currentUser || !connectionId) {
      return;
    }
    const loadMessages = async () => {
      try {
        const { messages: history } = await getUserMessages(connectionId);
        setUserMessages((prev) => {
          if (!prev.length) {
            return history;
          }
          const byId = new Map<string, ChatMessage>();
          for (const m of history) byId.set(m.id, m);
          for (const m of prev) byId.set(m.id, m);
          return Array.from(byId.values()).sort((a, b) => {
            const d = a.createdAt.localeCompare(b.createdAt);
            return d !== 0 ? d : a.id.localeCompare(b.id);
          });
        });
      } catch {
        setInfo('Failed to load messages');
      }
    };
    loadMessages();
  }, [connectionId, currentUser]);

  useEffect(() => {
    if (!currentUser || !connectionId) {
      return;
    }
    const userId = currentUser.id;
    const onMessage = (msg: ChatMessage) => {
      if (msg.connectionId !== connectionId) {
        return;
      }
      setUserMessages((prev) => (
        prev.some((m) => m.id === msg.id) ? prev : prev.concat(msg)
      ));
    };

    const onEnded = ({ connectionId: cId }: { connectionId: string }) => {
      if (cId !== connectionId) {
        return;
      }
      setEnded(true);
      setInfo('chat ended');
    };

    const refreshMeta = async () => {
      try {
        const m = await getConnectionMeta(connectionId);
        setUserMeta(m);
        if (m.status === 'ended') {
          setEnded(true);
        }
      } catch (e) {
        console.error(e);
        setUserMeta(null);
      }
    };

    const onAccepted = ({ connectionId: cId }: { connectionId: string }) => {
      if (cId !== connectionId) {
        return;
      }
      refreshMeta();
      socket.emit('chat-join', { connectionId, userId });
    };

    const onRejected = ({ connectionId: cId }: { connectionId: string }) => {
      if (cId !== connectionId) {
        return;
      }
      refreshMeta();
    };

    socket.on('chat-message', onMessage);
    socket.on('chat-ended', onEnded);
    socket.on('chat-accepted', onAccepted);
    socket.on('chat-rejected', onRejected);
    socket.emit('chat-join', { connectionId, userId });
    return () => {
      socket.off('chat-message', onMessage);
      socket.off('chat-ended', onEnded);
      socket.off('chat-accepted', onAccepted);
      socket.off('chat-rejected', onRejected);
    };
  }, [connectionId, currentUser, socket]);

  useEffect(() => {
    const el = listRef.current;
    if (!el) {
      return;
    }
    el.scrollTop = el.scrollHeight;
  }, [messages.length]);

  function endChat() {
    if (!currentUser || !connectionId) {
      return;
    }
    if (ended) {
      return;
    }
    socket.emit('chat-end', { connectionId, userId: currentUser.id });
  }

  function sendMessage() {
    if (!currentUser || !connectionId) {
      return;
    }
    if (!canSend) {
      return;
    }
    const clean = messageText.trim();
    if (!clean) {
      return;
    }
    socket.emit('chat-message', { connectionId, senderId: currentUser.id, content: clean });
    setUserMessageText('');
  }

  const otherUser = !meta || !currentUser ? null : meta.initiatorId === currentUser.id ? meta.recipient : meta.initiator;
  const canSend = !ended && meta?.status === 'accepted';
  return (
    <Container maxWidth="sm" className="chatPage">
      <div className="chatLayout">
        <div className="chatHeader">
          <h2 className="chatTitle">{otherUser ? `Chat with ${otherUser.name}` : 'Chat'}</h2>
          <Button variant="outlined" onClick={endChat} disabled={!meta || ended}>
            End Chat
          </Button>
          <Button variant="text" onClick={() => navigate('/')}>
            Home
          </Button>
        </div>

        {meta && meta.status !== 'accepted' ? <Alert severity="info">Chat is {meta.status}.</Alert> : null}
        {info ? <Alert severity={ended ? 'warning' : 'info'}>{info}</Alert> : null}
        
        <div className="chatDivider" />
        <div ref={listRef} className="chatMessages">
          {messages.map((m) => {
            const who = m.kind === 'system' ? 'system' : m.senderId === currentUser?.id ? 'me' : 'them';
            const time = formatMessageTime(m.createdAt);
            return (
              <div key={m.id} data-msg-id={m.id} className={`chatMsgRow chatMsgRow--${who}`}>
                <div className={`chatBubble chatBubble--${who}`}>
                  <div>{m.content}</div>
                  {time ? <div className="chatMsgTime">{time}</div> : null}
                </div>
              </div>
            );
          })}
        </div>
        
        <div className="chatInputRow">
          <input
            className="chatInput"
            placeholder={canSend ? 'Type a message' : 'Waiting for accept…'}
            value={messageText}
            onChange={(e) => setUserMessageText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                sendMessage();
              }
            }}
            disabled={!canSend}
          />
          <Button variant="contained" onClick={sendMessage} disabled={!canSend}>
            Send
          </Button>
        </div>
      </div>
    </Container>
  );
}
