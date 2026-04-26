import { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router';
import { Alert, Button, Container } from '@mui/material';
import { getConnectionMetadata, getMessagesByConnectionId } from '../../api';
import { getUser } from '../../auth';
import type { ChatMessage, ConnectionMeta, StatusPayload } from '../../types';
import './Chat.css';

export default function Chat({ socket }: { socket: any }) {
  const navigate = useNavigate();
  const { connectionId } = useParams();
  const [currentUser] = useState(() => getUser());
  const [connectionMetadata, setConnectionMetadata] = useState<ConnectionMeta | null>(null);
  const [messages, setUserMessages] = useState<ChatMessage[]>([]);
  const [messageText, setUserMessageText] = useState('');
  const [ended, setEnded] = useState(false);
  const [info, setInfo] = useState('');
  const listRef = useRef<HTMLDivElement | null>(null);

  function formatMessageTime(iso: string) {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) {
      return '';
    }
    return d.toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  useEffect(() => {
    if (!currentUser || !connectionId) {
      navigate('/login', { replace: true });
      return;
    }
  }, [connectionId, currentUser, navigate, socket]);

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
    const loadConnectionMetadata = async () => {
      try {
        const m = await getConnectionMetadata(connectionId);
        if (!m) {
          throw new Error('Invalid connection metadata');
        }
        setConnectionMetadata(m);
        if (m.status === 'ended') {
          setEnded(true);
        }
      } catch (e) {
        console.error(e);
        setConnectionMetadata(null);
      }
    };
    loadConnectionMetadata();
  }, [connectionId, currentUser]);

  useEffect(() => {
    if (!currentUser || !connectionId) {
      return;
    }
    const loadMessages = async () => {
      try {
        const { messages: history } = await getMessagesByConnectionId(connectionId);
        setUserMessages((prev) => {
          if (!prev.length) {
            return history;
          }
          const byId = new Map<string, ChatMessage>();
          for (const m of history) {
            byId.set(m.id, m);
          }
          for (const m of prev) {
            byId.set(m.id, m);
          }
          return Array.from(byId.values()).sort((a, b) => a.createdAt.localeCompare(b.createdAt));
        });
      } catch {
        setInfo('Error loading chat messages');
      }
    };
    loadMessages();
  }, [connectionId, currentUser]);

  useEffect(() => {
    if (!currentUser || !connectionId) {
      return;
    }
    const onMessage = (msg: any) => {
      if (msg?.connectionId !== connectionId) {
        return;
      }
      setUserMessages((prev) => (prev.some((m) => m.id === msg?.id) ? prev : prev.concat(msg as ChatMessage)));
    };
    const onEnded = ({ connectionId: cId }: StatusPayload) => {
      if (cId !== connectionId) {
        return;
      }
      setEnded(true);
      setInfo('Chat is ended');
    };
    const refreshMeta = async () => {
      try {
        const m = await getConnectionMetadata(connectionId);
        if (!m) {
          throw new Error('Invalid connection metadata');
        }
        setConnectionMetadata(m);
        if (m.status === 'ended') {
          setEnded(true);
        }
      } catch (e) {
        console.error(e);
        setConnectionMetadata(null);
      }
    };
    const onAccepted = ({ connectionId: cId }: StatusPayload) => {
      if (cId !== connectionId) {
        return;
      }
      refreshMeta();
    };
    const onRejected = ({ connectionId: cId }: StatusPayload) => {
      if (cId !== connectionId) {
        return;
      }
      refreshMeta();
    };
    socket.on('chat-message', onMessage);
    socket.on('chat-ended', onEnded);
    socket.on('chat-accepted', onAccepted);
    socket.on('chat-rejected', onRejected);
    return () => {
      socket.off('chat-message', onMessage);
      socket.off('chat-ended', onEnded);
      socket.off('chat-accepted', onAccepted);
      socket.off('chat-rejected', onRejected);
    };
  }, [connectionId, currentUser, socket]);

  useEffect(() => {
    const el = listRef?.current;
    if (!el) {
      return;
    }
    el.scrollTop = el.scrollHeight;
  }, [messages.length]);

  function endChat() {
    if (!currentUser || !connectionId || ended) {
      return;
    }
    socket.emit('chat-end', { connectionId, userId: currentUser.id });
  }

  function sendMessage() {
    if (!currentUser || !connectionId || !canSend || !messageText) {
      return;
    }
    socket.emit('chat-message', { connectionId, senderId: currentUser.id, content: messageText });
    setUserMessageText('');
  }

  const otherUser =
    !connectionMetadata || !currentUser
      ? null
      : connectionMetadata.initiatorId === currentUser.id
        ? connectionMetadata.recipient
        : connectionMetadata.initiator;
  
        const canSend = !ended && !!connectionMetadata && connectionMetadata.status === 'accepted';

  return (
    <Container maxWidth="sm" className="chatPage">
      <div className="chatLayout">
        <div className="chatHeader">
          <h2 className="chatTitle">{otherUser ? `Chat with ${otherUser.name}` : 'Chat'}</h2>
          <Button variant="outlined" onClick={endChat} disabled={!connectionMetadata || ended}>
            End Chat
          </Button>
          <Button variant="text" onClick={() => navigate('/')}>
            Home
          </Button>
        </div>

        {connectionMetadata && connectionMetadata.status !== 'accepted' ? (
          <Alert severity="info">Chat is {connectionMetadata.status}.</Alert>
        ) : null}
        {info ? <Alert severity={ended ? 'warning' : 'info'}>{info}</Alert> : null}

        <div className="chatDivider" />
        <div ref={listRef} className="chatMessages">
          {messages.map((m: any) => {
            const who =
              m.kind === 'system' ? 'system' : currentUser && m.senderId === currentUser.id ? 'self' : 'other';
            const time = formatMessageTime(m.createdAt);
            const whoCap = who.charAt(0).toUpperCase() + who.slice(1);
            return (
              <div key={m.id} data-msg-id={m.id} className={`chatMsgRow chatMsgRow${whoCap}`}>
                <div className={`chatBubble chatBubble${whoCap}`}>
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
