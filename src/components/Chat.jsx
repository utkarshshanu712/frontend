import { useState, useEffect, useRef } from "react";
import styled from "styled-components";
import { IoSend, IoAttach } from "react-icons/io5";

function Chat({ socket, username, onLogout }) {
  const [selectedUser, setSelectedUser] = useState(null);
  const [messages, setMessages] = useState([]);
  const [privateMessages, setPrivateMessages] = useState({});
  const [showPasswordChange, setShowPasswordChange] = useState(false);
  const [profilePic, setProfilePic] = useState(null);

  // Add new socket listeners
  useEffect(() => {
    socket.on("receive-private-message", (msg) => {
      setPrivateMessages(prev => ({
        ...prev,
        [msg.sender]: [...(prev[msg.sender] || []), msg]
      }));
    });

    socket.on("message-read", ({ messageId, reader }) => {
      // Update message read status
      setMessages(prev => prev.map(msg => 
        msg._id === messageId ? { ...msg, readBy: [...msg.readBy, reader] } : msg
      ));
    });

    socket.on("message-deleted", ({ messageId, deletedBy }) => {
      setMessages(prev => prev.map(msg => 
        msg._id === messageId 
          ? { ...msg, deletedBy: [...(msg.deletedBy || []), deletedBy] }
          : msg
      ));
      
      setPrivateMessages(prev => {
        const newPrivateMessages = { ...prev };
        Object.keys(newPrivateMessages).forEach(user => {
          newPrivateMessages[user] = newPrivateMessages[user].map(msg =>
            msg._id === messageId 
              ? { ...msg, deletedBy: [...(msg.deletedBy || []), deletedBy] }
              : msg
          );
        });
        return newPrivateMessages;
      });
    });

    return () => {
      socket.off("receive-private-message");
      socket.off("message-read");
      socket.off("message-deleted");
    };
  }, [socket]);

  const sendPrivateMessage = (message) => {
    if (selectedUser && message.trim()) {
      socket.emit("private-message", {
        receiver: selectedUser,
        message: message.trim()
      });
    }
  };

  const changePassword = (oldPassword, newPassword) => {
    socket.emit("change-password", {
      username,
      oldPassword,
      newPassword
    });
  };

  const deleteMessage = (messageId) => {
    socket.emit("delete-message", { messageId });
  };

  const renderMessage = (msg) => {
    if (msg.isDeleted || (msg.deletedBy && msg.deletedBy.includes(username))) {
      return <DeletedMessage>Message deleted</DeletedMessage>;
    }

    return (
      <MessageContainer>
        {msg.isFile ? (
          msg.type?.startsWith("image/") ? (
            <FileImage src={msg.data} alt={msg.name} />
          ) : (
            <FileDownload href={msg.data} download={msg.name}>
              📎 {msg.name}
            </FileDownload>
          )
        ) : (
          <MessageText>{msg.message}</MessageText>
        )}
        {msg.sender === username && (
          <DeleteButton onClick={() => deleteMessage(msg._id)}>
            🗑️
          </DeleteButton>
        )}
      </MessageContainer>
    );
  };

  // Render chat interface with private messages and group chat
  return (
    <ChatContainer>
      <UsersPanel>
        {/* User list with selection */}
      </UsersPanel>
      
      <ChatMain>
        {selectedUser ? (
          <PrivateChat
            messages={privateMessages[selectedUser] || []}
            onSend={sendPrivateMessage}
          />
        ) : (
          <GroupChat
            messages={messages}
            onSend={sendMessage}
          />
        )}
      </ChatMain>
      
      {showPasswordChange && (
        <PasswordChangeModal
          onSubmit={changePassword}
          onClose={() => setShowPasswordChange(false)}
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

const ChatMain = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  background: var(--bg-primary);

  @media (max-width: 768px) {
    height: 70vh;
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
