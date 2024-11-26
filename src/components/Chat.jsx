import { useState, useEffect, useRef } from "react";
import styled from "styled-components";
import { IoSend, IoAttach } from "react-icons/io5";

function Chat({ socket, username, onLogout }) {
  const [users, setUsers] = useState([]);
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [showPasswordChange, setShowPasswordChange] = useState(false);
  const messagesEndRef = useRef(null);
  const [deletedMessages, setDeletedMessages] = useState(new Set());

  useEffect(() => {
    socket.on("users-update", (updatedUsers) => {
      setUsers(updatedUsers.filter(user => user !== username));
    });

    socket.on("chat-message", (message) => {
      setMessages(prev => [...prev, message]);
    });

    socket.on("message-history", (history) => {
      setMessages(history);
    });

    socket.on("password-change-success", () => {
      alert("Password changed successfully!");
      setShowPasswordChange(false);
    });

    socket.on("password-change-failed", () => {
      alert("Failed to change password. Please try again.");
    });

    socket.on("message-deleted", ({ messageId, deletedBy }) => {
      setDeletedMessages(prev => new Set([...prev, messageId]));
    });

    return () => {
      socket.off("users-update");
      socket.off("chat-message");
      socket.off("message-history");
      socket.off("password-change-success");
      socket.off("password-change-failed");
      socket.off("message-deleted");
    };
  }, [socket, username]);

  const sendMessage = (e) => {
    e.preventDefault();
    if (message.trim()) {
      if (selectedUser) {
        socket.emit("private-message", {
          receiver: selectedUser,
          message: message.trim()
        });
      } else {
        socket.emit("send-message", {
          message: message.trim()
        });
      }
      setMessage("");
    }
  };

  const handleDeleteMessage = (messageId) => {
    socket.emit("delete-message", { messageId });
  };

  return (
    <ChatContainer>
      <Header>
        <h2>Chat Room</h2>
        <ButtonGroup>
          <Button onClick={() => setShowPasswordChange(true)}>
            Change Password
          </Button>
          <Button onClick={onLogout}>Logout</Button>
        </ButtonGroup>
      </Header>

      <ChatMain>
        <UsersPanel>
          <h3>Online Users ({users.length})</h3>
          <UsersList>
            {users.map((user, index) => (
              <UserItem 
                key={index}
                isSelected={user === selectedUser}
                onClick={() => setSelectedUser(user === selectedUser ? null : user)}
              >
                {user}
              </UserItem>
            ))}
          </UsersList>
        </UsersPanel>

        <MessagesContainer>
          {messages.map((msg, index) => (
            <MessageContainer key={index}>
              <MessageBubble isOwn={msg.sender === username || msg.username === username}>
                {deletedMessages.has(msg._id) ? (
                  <DeletedMessage>Message deleted</DeletedMessage>
                ) : (
                  <>
                    <Username>{msg.sender || msg.username}</Username>
                    <MessageText>{msg.message}</MessageText>
                    <Timestamp>{new Date(msg.timestamp).toLocaleTimeString()}</Timestamp>
                    {(msg.sender === username || msg.username === username) && (
                      <DeleteButton onClick={() => handleDeleteMessage(msg._id)}>
                        ×
                      </DeleteButton>
                    )}
                  </>
                )}
              </MessageBubble>
            </MessageContainer>
          ))}
          <div ref={messagesEndRef} />
        </MessagesContainer>

        <MessageForm onSubmit={sendMessage}>
          <MessageInput
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder={`Message ${selectedUser || 'everyone'}...`}
          />
          <SendButton type="submit">
            <IoSend />
          </SendButton>
        </MessageForm>
      </ChatMain>

      {showPasswordChange && (
        <PasswordChangeModal
          onClose={() => setShowPasswordChange(false)}
          onSubmit={(oldPassword, newPassword) => {
            socket.emit("change-password", {
              username,
              oldPassword,
              newPassword
            });
          }}
        />
      )}
    </ChatContainer>
  );
}

const ChatContainer = styled.div`
  display: flex;
  width: 100%;
  height: 100vh;
  background: var(--bg-primary);
  overflow: hidden;

  @media (max-width: 768px) {
    flex-direction: column;
  }
`;

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem;
  background: var(--bg-secondary);
  border-bottom: 1px solid var(--border-color);

  h2 {
    font-size: 1.5rem;
    color: var(--text-primary);
  }

  @media (max-width: 768px) {
    flex-direction: column;
    align-items: flex-start;
  }
`;

const ButtonGroup = styled.div`
  display: flex;
  gap: 0.5rem;

  @media (max-width: 768px) {
    flex-direction: column;
  }
`;

const Button = styled.button`
  background: var(--accent-color);
  color: var(--text-primary);
  border: none;
  padding: 0.5rem 1rem;
  border-radius: 4px;
  cursor: pointer;

  &:hover {
    opacity: 0.9;
  }
`;

const ChatMain = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  background: var(--bg-primary);

  @media (max-width: 768px) {
    height: 70vh;
  }
`;

const UsersPanel = styled.div`
  width: 300px;
  background: var(--bg-secondary);
  border-right: 1px solid var(--border-color);

  h3 {
    padding: 1rem;
    color: var(--text-primary);
    border-bottom: 1px solid var(--border-color);
  }

  @media (max-width: 768px) {
    width: 100%;
    height: auto;
    max-height: 30vh;
  }
`;

const UsersList = styled.div`
  padding: 0.5rem;
  overflow-y: auto;
  height: calc(100% - 60px);
`;

const UserItem = styled.div`
  padding: 0.8rem;
  border-radius: 8px;
  margin-bottom: 0.5rem;
  background: var(--bg-primary);
  color: var(--text-primary);
  transition: background 0.2s;

  &:hover {
    background: var(--hover-color);
  }
`;

const MessagesContainer = styled.div`
  flex: 1;
  padding: 1rem;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  background: var(--bg-primary);
`;

const MessageBubble = styled.div`
  max-width: 75%;
  margin: 0.5rem;
  padding: 0.8rem;
  border-radius: 8px;
  background: ${(props) =>
    props.isOwn ? "var(--message-out)" : "var(--message-in)"};
  align-self: ${(props) => (props.isOwn ? "flex-end" : "flex-start")};

  @media (max-width: 768px) {
    max-width: 85%;
  }
`;

const Username = styled.div`
  font-size: 0.8rem;
  color: #128c7e;
  margin-bottom: 0.2rem;
`;

const MessageText = styled.div`
  word-break: break-word;
`;

const Timestamp = styled.div`
  font-size: 0.7rem;
  color: #666;
  text-align: right;
  margin-top: 0.2rem;
`;

const MessageForm = styled.form`
  display: flex;
  padding: 1rem;
  background: var(--bg-secondary);
  gap: 0.8rem;
  border-top: 1px solid var(--border-color);
`;

const MessageInput = styled.input`
  flex: 1;
  padding: 0.8rem;
  border: 1px solid var(--border-color);
  border-radius: 20px;
  background: var(--bg-primary);
  color: var(--text-primary);
  outline: none;

  &::placeholder {
    color: var(--text-secondary);
  }
`;

const SendButton = styled.button`
  background: var(--accent-color);
  color: var(--text-primary);
  border: none;
  border-radius: 50%;
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;

  &:hover {
    background: #128c7e;
  }
`;

const FileInput = styled.input`
  display: none;
`;

const AttachButton = styled.button`
  background: transparent;
  color: var(--text-secondary);
  border: none;
  padding: 0.5rem;
  cursor: pointer;
  font-size: 1.5rem;
  display: flex;
  align-items: center;
  transition: color 0.2s;

  &:hover {
    color: var(--accent-color);
  }
`;

const FileImage = styled.img`
  max-width: 200px;
  max-height: 200px;
  border-radius: 8px;
  margin: 0.5rem 0;
`;

const FileDownload = styled.a`
  color: var(--accent-color);
  text-decoration: none;
  display: flex;
  align-items: center;
  gap: 0.5rem;

  &:hover {
    text-decoration: underline;
  }
`;

const LogoutButton = styled.button`
  position: absolute;
  top: 1rem;
  right: 1rem;
  background: var(--accent-color);
  color: var(--text-primary);
  border: none;
  padding: 0.5rem 1rem;
  border-radius: 4px;
  cursor: pointer;
  
  &:hover {
    opacity: 0.9;
  }
`;

const DeletedMessage = styled.div`
  font-style: italic;
  color: var(--text-secondary);
  font-size: 0.9rem;
`;

const MessageContainer = styled.div`
  position: relative;
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

const DeleteButton = styled.button`
  background: transparent;
  border: none;
  cursor: pointer;
  opacity: 0;
  transition: opacity 0.2s;
  padding: 4px;
  
  ${MessageContainer}:hover & {
    opacity: 1;
  }
`;

export default Chat;
