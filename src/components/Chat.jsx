import { useState, useEffect, useRef } from "react";
import styled from "styled-components";
import { IoSend, IoAttach, IoCamera, IoClose, IoMenu } from "react-icons/io5";
import PasswordChangeModal from "./PasswordChangeModal";

function Chat({ socket, username, onLogout }) {
  const [users, setUsers] = useState([]);
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [showPasswordChange, setShowPasswordChange] = useState(false);
  const [profilePic, setProfilePic] = useState(null);
  const [deletedMessages, setDeletedMessages] = useState(new Set());
  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    // Load profile picture if exists
    const savedProfilePic = localStorage.getItem(`profilePic_${username}`);
    if (savedProfilePic) {
      setProfilePic(savedProfilePic);
    }

    socket.on("users-update", (updatedUsers) => {
      setUsers(updatedUsers.filter(user => user !== username));
    });

    socket.on("chat-message", (message) => {
      setMessages(prev => [...prev, message]);
    });

    socket.on("private-message", (message) => {
      setMessages(prev => [...prev, { ...message, isPrivate: true }]);
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

    socket.on("profile-pic-updated", ({ success }) => {
      if (success) {
        alert("Profile picture updated successfully!");
      } else {
        alert("Failed to update profile picture. Please try again.");
      }
    });

    socket.on("receive-message", (message) => {
      setMessages(prev => [...prev, message]);
    });

    socket.on("receive-file", (fileMessage) => {
      setMessages(prev => [...prev, fileMessage]);
    });

    socket.on("message-history", (history) => {
      setMessages(history);
    });

    return () => {
      socket.off("users-update");
      socket.off("chat-message");
      socket.off("private-message");
      socket.off("message-history");
      socket.off("password-change-success");
      socket.off("password-change-failed");
      socket.off("message-deleted");
      socket.off("profile-pic-updated");
      socket.off("receive-message");
      socket.off("receive-file");
      socket.off("message-history");
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

  const handleProfilePicChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 50000000) { // 50MB limit
        alert("File size too large. Please choose an image under 50MB.");
        return;
      }

      const reader = new FileReader();
      reader.onloadend = () => {
        const imageData = reader.result;
        socket.emit("update-profile-pic", {
          username,
          profilePic: imageData
        });
        setProfilePic(imageData);
        localStorage.setItem(`profilePic_${username}`, imageData);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 50000000) { // 50MB limit
        alert("File size too large. Please choose a file under 50MB.");
        return;
      }

      const reader = new FileReader();
      reader.onloadend = () => {
        socket.emit("send-file", {
          name: file.name,
          type: file.type,
          data: reader.result
        });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage(e);
    }
  };

  return (
    <ChatContainer>
      <Header>
        <UserInfo>
          <HamburgerButton onClick={() => setIsSidebarOpen(!isSidebarOpen)}>
            <IoMenu />
          </HamburgerButton>
          <ProfilePicContainer>
            {profilePic ? (
              <ProfilePic src={profilePic} alt={username} />
            ) : (
              <DefaultProfilePic>{username[0].toUpperCase()}</DefaultProfilePic>
            )}
            <CameraOverlay onClick={() => fileInputRef.current?.click()}>
              <IoCamera />
            </CameraOverlay>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleProfilePicChange}
              accept="image/*"
              style={{ display: 'none' }}
            />
          </ProfilePicContainer>
          <Username>{username}</Username>
          {selectedUser && (
            <PrivateChatIndicator>
              Chatting with {selectedUser}
              <CloseButton onClick={() => setSelectedUser(null)}>
                <IoClose />
              </CloseButton>
            </PrivateChatIndicator>
          )}
        </UserInfo>
        <ButtonGroup>
          <Button onClick={() => setShowPasswordChange(true)}>
            Change Password
          </Button>
          <Button onClick={onLogout}>Logout</Button>
        </ButtonGroup>
      </Header>

      <ChatLayout isSidebarOpen={isSidebarOpen}>
        <Sidebar isOpen={isSidebarOpen}>
          <h3>Online Users ({users.length})</h3>
          <UsersList>
            {users.map((user) => (
              <UserItem
                key={user}
                isSelected={user === selectedUser}
                onClick={() => setSelectedUser(user === selectedUser ? null : user)}
              >
                <UserAvatar>{user[0].toUpperCase()}</UserAvatar>
                <span>{user}</span>
              </UserItem>
            ))}
          </UsersList>
        </Sidebar>

        <MessagesArea>
          <MessagesContainer>
            {messages.map((msg, index) => (
              <MessageBubble
                key={index}
                isOwn={msg.sender === username || msg.username === username}
                isPrivate={msg.isPrivate}
              >
                {deletedMessages.has(msg._id) ? (
                  <DeletedMessage>Message deleted</DeletedMessage>
                ) : (
                  <MessageContent>
                    <SenderName>{msg.sender || msg.username}</SenderName>
                    <MessageText>{msg.message}</MessageText>
                    <TimeStamp>
                      {new Date(msg.timestamp).toLocaleTimeString()}
                    </TimeStamp>
                    {(msg.sender === username || msg.username === username) && (
                      <DeleteButton onClick={() => handleDeleteMessage(msg._id)}>
                        <IoClose />
                      </DeleteButton>
                    )}
                  </MessageContent>
                )}
              </MessageBubble>
            ))}
            <div ref={messagesEndRef} />
          </MessagesContainer>

          <MessageForm onSubmit={sendMessage}>
            <MessageInput
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder={`Message ${selectedUser || 'everyone'}...`}
            />
            <AttachButton onClick={() => fileInputRef.current.click()}>
              <IoAttach />
            </AttachButton>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileUpload}
              style={{ display: 'none' }}
            />
            <SendButton type="submit">
              <IoSend />
            </SendButton>
          </MessageForm>
        </MessagesArea>
      </ChatLayout>

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
  height: 100vh;
  width: 100vw;
  display: flex;
  flex-direction: column;
  background: var(--bg-primary);
  margin: 0;
  padding: 0;
  overflow: hidden;
`;

const Header = styled.header`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem;
  background: var(--bg-secondary);
  border-bottom: 1px solid var(--border-color);
  position: relative;
`;

const ChatLayout = styled.div`
  display: grid;
  grid-template-columns: ${props => props.isSidebarOpen ? '300px 1fr' : '0 1fr'};
  height: calc(100vh - 70px);
  transition: grid-template-columns 0.3s ease;
  
  @media (max-width: 768px) {
    grid-template-columns: 1fr;
    position: relative;
  }
`;

const Sidebar = styled.aside`
  background: var(--bg-secondary);
  border-right: 1px solid var(--border-color);
  overflow-y: auto;
  transition: transform 0.3s ease;
  
  @media (max-width: 768px) {
    position: absolute;
    left: 0;
    top: 0;
    bottom: 0;
    width: 280px;
    transform: translateX(${props => props.isOpen ? '0' : '-100%'});
    z-index: 10;
  }
`;

const UserInfo = styled.div`
  display: flex;
  align-items: center;
  gap: 1rem;
`;

const ProfilePicContainer = styled.div`
  position: relative;
  width: 40px;
  height: 40px;
`;

const ProfilePic = styled.img`
  width: 100%;
  height: 100%;
  border-radius: 50%;
  object-fit: cover;
`;

const DefaultProfilePic = styled.div`
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: var(--accent-color);
  color: var(--text-primary);
  display: flex;
  align-items: center;
  justify-content: center;
`;

const CameraOverlay = styled.div`
  position: absolute;
  bottom: -5px;
  right: -5px;
  background: var(--accent-color);
  border-radius: 50%;
  padding: 5px;
  cursor: pointer;
  
  &:hover {
    opacity: 0.9;
  }
`;

const Username = styled.h2`
  font-size: 1.5rem;
  color: var(--text-primary);
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

const ChatMain = styled.main`
  flex: 1;
  display: grid;
  grid-template-columns: 280px 1fr;
  overflow: hidden;

  @media (max-width: 768px) {
    grid-template-columns: 1fr;
    grid-template-rows: auto 1fr;
  }
`;

const UsersList = styled.div`
  background: var(--bg-secondary);
  border-right: 1px solid var(--border-color);
  overflow-y: auto;
  padding: 1rem;

  @media (max-width: 768px) {
    border-right: none;
    border-bottom: 1px solid var(--border-color);
    max-height: 150px;
  }
`;

const UserItem = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.8rem;
  border-radius: 8px;
  cursor: pointer;
  background: ${props => props.isSelected ? 'var(--hover-color)' : 'transparent'};

  &:hover {
    background: var(--hover-color);
  }
`;

const UserAvatar = styled.div`
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: var(--accent-color);
  color: var(--text-primary);
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 0.5rem;
`;

const MessagesContainer = styled.div`
  flex: 1;
  overflow-y: auto;
  padding: 1rem;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  
  &::-webkit-scrollbar {
    width: 6px;
  }
  
  &::-webkit-scrollbar-thumb {
    background: var(--accent-color);
    border-radius: 3px;
  }
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

const MessageContent = styled.div`
  display: flex;
  flex-direction: column;
`;

const SenderName = styled.div`
  font-size: 0.8rem;
  color: #128c7e;
  margin-bottom: 0.2rem;
`;

const MessageText = styled.div`
  word-break: break-word;
`;

const TimeStamp = styled.div`
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
  position: sticky;
  bottom: 0;
`;

const MessageInput = styled.textarea`
  flex: 1;
  padding: 0.8rem;
  border: 1px solid var(--border-color);
  border-radius: 20px;
  background: var(--bg-primary);
  color: var(--text-primary);
  outline: none;
  resize: none;
  min-height: 40px;
  max-height: 100px;
  
  &::placeholder {
    color: var(--text-secondary);
  }
  
  &:focus {
    border-color: var(--accent-color);
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

const MessagesArea = styled.div`
  display: flex;
  flex-direction: column;
  height: 100%;
  max-height: 100%;
  background: var(--bg-primary);
`;

const MessageInputContainer = styled.div`
  padding: 1rem;
  background: var(--bg-secondary);
  border-top: 1px solid var(--border-color);
  display: flex;
  gap: 0.5rem;
`;

const IconButton = styled.button`
  background: var(--accent-color);
  color: white;
  border: none;
  border-radius: 50%;
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  
  &:hover {
    opacity: 0.9;
  }
`;

const PrivateChatIndicator = styled.div`
  font-size: 0.8rem;
  color: var(--text-secondary);
  margin-left: 0.5rem;
`;

const CloseButton = styled.button`
  background: transparent;
  border: none;
  cursor: pointer;
  padding: 4px;
`;

const ProfilePicInput = styled.input`
  display: none;
`;

const ProfilePicButton = styled.button`
  background: transparent;
  border: none;
  cursor: pointer;
  position: relative;
  
  &:hover {
    opacity: 0.8;
  }
`;

const HamburgerButton = styled.button`
  display: none;
  background: transparent;
  border: none;
  color: var(--text-primary);
  font-size: 1.5rem;
  cursor: pointer;
  padding: 0.5rem;
  
  @media (max-width: 768px) {
    display: flex;
    align-items: center;
    justify-content: center;
  }
`;

export default Chat;
