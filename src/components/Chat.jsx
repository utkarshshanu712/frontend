import { useState, useEffect, useRef } from "react";
import styled from "styled-components";
import { IoSend, IoAttach, IoCamera, IoClose, IoMenu, IoPeople } from "react-icons/io5";
import PasswordChangeModal from "./PasswordChangeModal";
import logoImage from '../assets/trans1_480x480.png';

const createChatId = (user1, user2) => {
  return [user1, user2].sort().join('_');
};

function Chat({ socket, username, onLogout }) {
  const [users, setUsers] = useState([]);
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [privateChatUsers, setPrivateChatUsers] = useState([]);
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [showPasswordChange, setShowPasswordChange] = useState(false);
  const [profilePic, setProfilePic] = useState(null);
  const [deletedMessages, setDeletedMessages] = useState(new Set());
  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [chatHistory, setChatHistory] = useState({});
  const [activeSection, setActiveSection] = useState('private'); // 'private' or 'group'

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (messagesEndRef.current) {
      const smoothScroll = () => {
        messagesEndRef.current.scrollIntoView({ 
          behavior: "smooth",
          block: "end"
        });
      };
      
      // Small delay to ensure content is rendered
      setTimeout(smoothScroll, 100);
    }
  }, [messages]);

  useEffect(() => {
    // Load profile picture if exists
    const savedProfilePic = localStorage.getItem(`profilePic_${username}`);
    if (savedProfilePic) {
      setProfilePic(savedProfilePic);
    }

    // Fetch all users
    fetch(`${import.meta.env.VITE_API_URL}/users`)
      .then(res => res.json())
      .then(allUsers => {
        setUsers(allUsers.map(user => user.username).filter(user => user !== username));
      });

    // Handle online users updates
    socket.on("users-update", (updatedUsers) => {
      setOnlineUsers(updatedUsers.filter(user => user !== username));
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

    socket.on("message-deleted", ({ messageId }) => {
      // Remove the message completely from the messages array
      setMessages(prevMessages => 
        prevMessages.filter(msg => msg._id !== messageId)
      );
      
      // Clean up any references in deletedMessages set
      setDeletedMessages(prev => {
        const newSet = new Set(prev);
        newSet.delete(messageId);
        return newSet;
      });
    });

    socket.on("profile-pic-updated", ({ success }) => {
      if (success) {
        alert("Profile picture updated successfully!");
      } else {
        alert("Failed to update profile picture. Please try again.");
      }
    });

    socket.on("receive-message", (message) => {
      setMessages(prev => {
        // Check if message already exists (prevent duplicates)
        const exists = prev.some(m => m._id === message._id);
        if (!exists) {
          // Add to private chat users if it's a private message
          if (message.receiver === username || message.sender === username) {
            const otherUser = message.sender === username ? message.receiver : message.sender;
            if (otherUser && !privateChatUsers.includes(otherUser)) {
              const updatedPrivateChats = [...privateChatUsers, otherUser];
              setPrivateChatUsers(updatedPrivateChats);
              localStorage.setItem(`privatechats_${username}`, JSON.stringify(updatedPrivateChats));
            }
          }
          return [...prev, message];
        }
        return prev;
      });
    });

    socket.on("receive-file", (fileMessage) => {
      setMessages(prev => [...prev, fileMessage]);
    });

    // Remove duplicate message-history listener
    socket.on("message-history", (history) => {
      setMessages(history);
    });

    // Load private chat users from localStorage
    const savedPrivateChats = localStorage.getItem(`privatechats_${username}`);
    if (savedPrivateChats) {
      setPrivateChatUsers(JSON.parse(savedPrivateChats));
    }

    socket.on("delete-failed", ({ error }) => {
      alert(`Failed to delete message: ${error}`);
      // Refresh messages to restore state
      socket.emit("get-messages");
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
      socket.off("delete-failed");
    };
  }, [socket, username]);

  const sendMessage = (e) => {
    e.preventDefault();
    if (message.trim()) {
      const chatId = selectedUser ? createChatId(username, selectedUser) : 'broadcast';
      const messageData = {
        sender: username,
        receiver: selectedUser,
        message: message.trim(),
        chatId,
        timestamp: new Date().toISOString()
      };

      socket.emit("send-message", messageData);
      
      // Optimistically add message to local state
      setMessages(prev => [...prev, {
        ...messageData,
        _id: Date.now().toString() // Temporary ID until server confirms
      }]);

      // Add user to private chats if not already present
      if (selectedUser && !privateChatUsers.includes(selectedUser)) {
        const updatedPrivateChats = [...privateChatUsers, selectedUser];
        setPrivateChatUsers(updatedPrivateChats);
        localStorage.setItem(`privatechats_${username}`, JSON.stringify(updatedPrivateChats));
      }

      setMessage("");
    }
  };

  const handleDeleteMessage = (messageId) => {
    socket.emit("delete-message", { messageId });
    
    // Remove message from local state immediately
    setMessages(prevMessages => 
      prevMessages.filter(msg => msg._id !== messageId)
    );
    
    // Remove from deletedMessages set if it exists
    setDeletedMessages(prev => {
      const newSet = new Set(prev);
      newSet.delete(messageId);
      return newSet;
    });
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

  useEffect(() => {
    if (selectedUser) {
      const chatId = [username, selectedUser].sort().join('_');
      
      // Load chat history if not already loaded
      if (!chatHistory[chatId]) {
        fetch(`${import.meta.env.VITE_API_URL}/api/messages/${chatId}`)
          .then(res => res.json())
          .then(messages => {
            setChatHistory(prev => ({
              ...prev,
              [chatId]: messages
            }));
          })
          .catch(console.error);
      }
    }
  }, [selectedUser]);

  const displayMessages = selectedUser
    ? (chatHistory[[username, selectedUser].sort().join('_')] || [])
    : messages.filter(msg => !msg.receiver);

  const renderUserList = () => (
    <UserList>
      <SectionToggle>
        <button 
          className={activeSection === 'private' ? 'active' : ''} 
          onClick={() => setActiveSection('private')}
        >
          Private Chats
        </button>
        <button 
          className={activeSection === 'group' ? 'active' : ''} 
          onClick={() => setActiveSection('group')}
        >
          Group Chats
        </button>
      </SectionToggle>

      {activeSection === 'private' && (
        <>
          <UserListSection>
            <SectionTitle>Online Users</SectionTitle>
            {onlineUsers.map((user) => (
              <UserItem 
                key={user} 
                isSelected={selectedUser === user}
                onClick={() => {
                  setSelectedUser(user);
                  if (!privateChatUsers.includes(user)) {
                    const updatedChats = [...privateChatUsers, user];
                    setPrivateChatUsers(updatedChats);
                    localStorage.setItem(`privatechats_${username}`, JSON.stringify(updatedChats));
                  }
                }}
              >
                <UserAvatar hasImage={false} isOnline>
                  {user[0].toUpperCase()}
                </UserAvatar>
                <div>
                  <UserName>{user}</UserName>
                  <LastMessage>
                    {chatHistory[createChatId(username, user)]?.[0]?.message || 'Click to start chatting'}
                  </LastMessage>
                </div>
              </UserItem>
            ))}
          </UserListSection>

          <UserListSection>
            <SectionTitle>Offline Users</SectionTitle>
            {users
              .filter(user => !onlineUsers.includes(user))
              .map((user) => (
                <UserItem 
                  key={user} 
                  isSelected={selectedUser === user}
                  onClick={() => {
                    setSelectedUser(user);
                    if (!privateChatUsers.includes(user)) {
                      const updatedChats = [...privateChatUsers, user];
                      setPrivateChatUsers(updatedChats);
                      localStorage.setItem(`privatechats_${username}`, JSON.stringify(updatedChats));
                    }
                  }}
                >
                  <UserAvatar hasImage={false}>
                    {user[0].toUpperCase()}
                  </UserAvatar>
                  <div>
                    <UserName>{user}</UserName>
                    <LastMessage>Offline</LastMessage>
                  </div>
                </UserItem>
              ))}
          </UserListSection>

          {privateChatUsers.length > 0 && (
            <UserListSection>
              <SectionTitle>Recent Chats</SectionTitle>
              {privateChatUsers.map((user) => (
                <UserItem 
                  key={user} 
                  isSelected={selectedUser === user}
                  onClick={() => setSelectedUser(user)}
                >
                  <UserAvatar 
                    hasImage={false}
                    isOnline={onlineUsers.includes(user)}
                  >
                    {user[0].toUpperCase()}
                  </UserAvatar>
                  <div>
                    <UserName>{user}</UserName>
                    <LastMessage>
                      {onlineUsers.includes(user) ? 'Online' : 'Offline'}
                    </LastMessage>
                  </div>
                </UserItem>
              ))}
            </UserListSection>
          )}
        </>
      )}
      
      {activeSection === 'group' && (
        <GroupList>
          <GroupItem onClick={() => setSelectedUser(null)}>
            <UserAvatar hasImage={false}>
              <IoPeople />
            </UserAvatar>
            <div>
              <UserName>General Chat</UserName>
              <LastMessage>Public chat room</LastMessage>
            </div>
          </GroupItem>
        </GroupList>
      )}
    </UserList>
  );

  return (
    <ChatContainer>
      <Header>
        <HeaderLogo src={logoImage} alt="Friend Chat Logo" />
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
          <SidebarHeader>
            <UserProfile>
              <UserAvatar hasImage={!!profilePic}>
                {profilePic ? (
                  <img src={profilePic} alt={username} />
                ) : (
                  username[0].toUpperCase()
                )}
              </UserAvatar>
              <span>{username}</span>
            </UserProfile>
          </SidebarHeader>
          {renderUserList()}
        </Sidebar>

        <MessagesArea>
          <MessagesContainer>
            {displayMessages.map((msg, index) => (
              <MessageBubble
                key={msg._id || index}
                isOwn={msg.sender === username || msg.username === username}
                isPrivate={msg.isPrivate}
              >
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
  background: #111B21;
  margin: 0;
  padding: 0;
 
`;

const Header = styled.header`
  display: flex;
  align-items: center;
  padding: 1rem;
  background: var(--bg-secondary);
  border-bottom: 1px solid var(--border-color);
  gap: 1rem;
`;

const HeaderLogo = styled.img`
  width: 40px;
  height: 40px;
`;

const ChatLayout = styled.div`
  display: grid;
  grid-template-columns: ${props => props.isSidebarOpen ? '300px 1fr' : '0 1fr'};
  flex: 1;
  overflow: hidden;
  transition: grid-template-columns 0.3s ease;
  
  @media (max-width: 768px) {
    grid-template-columns: 1fr;
    position: relative;
  }
`;

const Sidebar = styled.div`
  width: 300px;
  background: var(--bg-secondary);
  border-right: 1px solid var(--border-color);
  display: flex;
  flex-direction: column;
  transition: transform 0.3s ease;

  @media (max-width: 768px) {
    position: absolute;
    height: 100%;
    transform: ${({ isOpen }) => isOpen ? 'translateX(0)' : 'translateX(-100%)'};
    z-index: 10;
  }
`;

const UserInfo = styled.div`
  display: flex;
  align-items: center;
  gap: 1rem;
  color: #ffffff;
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
  background: #111B21;
  color: #ffffff;
  display: flex;
  align-items: center;
  justify-content: center;
`;

const CameraOverlay = styled.div`
  position: absolute;
  bottom: -5px;
  right: -5px;
  background: #111B21;
  color: #ffffff;
  border-radius: 50%;
  padding: 5px;
  cursor: pointer;
  
  &:hover {
    opacity: 0.9;
  }
`;

const Username = styled.h2`
  font-size: 1.5rem;
  color: #ffffff;
`;

const ButtonGroup = styled.div`
  display: flex;
  gap: 0.5rem;

  @media (max-width: 768px) {
    flex-direction: column;
  }
`;

const Button = styled.button`
  background: #111B21;
  color: #ffffff;
  border: none;
  padding: 0.5rem 1rem;
  border-radius: 4px;
  cursor: pointer;

  &:hover {
    opacity: 0.9;
  }
`;

const UserList = styled.div`
  flex: 1;
  overflow-y: auto;
  padding: 1rem;
`;

const UserItem = styled.div`
  display: flex;
  align-items: center;
  padding: 0.8rem;
  border-radius: 8px;
  cursor: pointer;
  margin-bottom: 0.5rem;
  background: ${({ isSelected }) => isSelected ? 'var(--hover-color)' : 'transparent'};

  &:hover {
    background: var(--hover-color);
  }
`;

const MessagesContainer = styled.div`
  flex: 1;
  overflow-y: auto;
  padding: 1rem;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  background-image: url('https://th.bing.com/th/id/R.2be118045076a1930ed1e494a259bbfc?rik=bSzCHAlO6ex4CQ&riu=http%3a%2f%2fwallpaperstock.net%2fwhatsapp-background-wallpapers_51439_1280x1024.jpg&ehk=9G0aB2SKVSQu0zmeYQ6Z3EOqBtHt2kRO8p5rTZx1D9Y%3d&risl=&pid=ImgRaw&r=0');
  background-size: cover;
  background-position: center;
  border-radius: 8px;
  
  &::-webkit-scrollbar {
    width: 6px;
  }
  
  &::-webkit-scrollbar-thumb {
    background: #404040;
    border-radius: 3px;
  }
`;




const MessageBubble = styled.div`
  position: relative;
  padding: 0.8rem 1rem;
  border-radius: 8px;
  max-width: 70%;
  word-wrap: break-word;
  background: ${props => props.isOwn ? 'var(--message-out)' : 'var(--message-in)'};
  align-self: ${props => props.isOwn ? 'flex-end' : 'flex-start'};

  &:hover .delete-btn {
    display: block;
  }
`;

const MessageContent = styled.div`
  display: flex;
  flex-direction: column;
  color: inherit;
`;

const SenderName = styled.div`
  font-size: 0.8rem;
  color: #a0a0a0;
  margin-bottom: 0.2rem;
`;

const MessageText = styled.div`
  word-break: break-word;
  color: inherit;
`;

const TimeStamp = styled.div`
  font-size: 0.7rem;
  color: #a0a0a0;
  text-align: right;
  margin-top: 0.2rem;
`;

const MessageForm = styled.form`
  display: flex;
  padding: 1rem;
  background: #202C33;
  gap: 0.8rem;
  border-top: 1px solid #111B21;
  position: sticky;
  bottom: 0;
`;

const MessageInput = styled.textarea`
  flex: 1;
  padding: 0.8rem;
  border: 1px solid #111B21;
  border-radius: 20px;
  background: #111B21;
  color: #ffffff;
  outline: none;
  resize: none;
  min-height: 40px;
  max-height: 100px;
  overflow-y: auto;
  word-break: break-word;
  
  &::-webkit-scrollbar {
    width: 4px;
  }
  
  &::-webkit-scrollbar-thumb {
    background: #111B21;
    border-radius: 2px;
  }
  
  &::placeholder {
    color: #a0a0a0;
  }
  
  &:focus {
    border-color: #202C33;
  }
`;

const SendButton = styled.button`
  background: #111B21;
  color: #ffffff;
  border: none;
  border-radius: 50%;
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;

  &:hover {
    background: #202C33;
  }
`;

const AttachButton = styled.button`
  background: transparent;
  color: #ffffff;
  border: none;
  padding: 0.5rem;
  cursor: pointer;
  font-size: 1.5rem;
  display: flex;
  align-items: center;
  transition: color 0.2s;

  &:hover {
    color: #202C33;
  }
`;

const DeletedMessage = styled.div`
  font-style: italic;
  color: #a0a0a0;
  font-size: 0.9rem;
`;

const DeleteButton = styled.button`
  display: none;
  position: absolute;
  top: -10px;
  right: -10px;
  background: var(--bg-secondary);
  border: none;
  border-radius: 50%;
  padding: 4px;
  cursor: pointer;
  color: var(--text-secondary);

  &:hover {
    color: var(--text-primary);
  }
`;

const MessagesArea = styled.div`
  display: flex;
  flex-direction: column;
  height: 100%;
  overflow: hidden;
  background: #111B21;
`;

const PrivateChatIndicator = styled.div`
  font-size: 0.8rem;
  color: #ffffff;
  margin-left: 0.5rem;
`;

const CloseButton = styled.button`
  background: transparent;
  border: none;
  cursor: pointer;
  padding: 4px;
  color: #ffffff;
`;

const HamburgerButton = styled.button`
  display: none;
  background: transparent;
  border: none;
  color: #ffffff;
  font-size: 1.5rem;
  cursor: pointer;
  padding: 0.5rem;
  
  @media (max-width: 768px) {
    display: flex;
    align-items: center;
    justify-content: center;
  }
`;

const SectionToggle = styled.div`
  display: flex;
  margin-bottom: 1rem;
  border-bottom: 1px solid var(--border-color);
  
  button {
    flex: 1;
    background: transparent;
    border: none;
    color: var(--text-secondary);
    padding: 0.8rem;
    cursor: pointer;
    
    &.active {
      color: var(--accent-color);
      border-bottom: 2px solid var(--accent-color);
    }
  }
`;

const UserName = styled.div`
  color: var(--text-primary);
  font-weight: 500;
`;

const LastMessage = styled.div`
  color: var(--text-secondary);
  font-size: 0.8rem;
  margin-top: 0.2rem;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 200px;
`;

const GroupList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
`;

const GroupItem = styled(UserItem)``;

const UserProfile = styled.div`
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1rem;
  border-bottom: 1px solid var(--border-color);
  
  span {
    color: var(--text-primary);
    font-weight: 500;
  }
`;

const MenuButton = styled.button`
  background: transparent;
  border: none;
  color: var(--text-secondary);
  cursor: pointer;
  padding: 0.5rem;
  display: flex;
  align-items: center;
  justify-content: center;
  
  &:hover {
    color: var(--text-primary);
  }
`;

const SidebarHeader = styled.div`
  padding: 0.5rem;
  border-bottom: 1px solid var(--border-color);
  background: var(--bg-secondary);
`;

const UserListSection = styled.div`
  margin-bottom: 1rem;
`;

const SectionTitle = styled.h3`
  color: var(--text-secondary);
  font-size: 0.9rem;
  padding: 0.5rem 1rem;
  margin-bottom: 0.5rem;
`;

const UserAvatar = styled.div`
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: ${({ hasImage }) => hasImage ? 'none' : 'var(--accent-color)'};
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 1rem;
  overflow: hidden;
  position: relative;

  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  &::after {
    content: '';
    position: absolute;
    bottom: 2px;
    right: 2px;
    width: 10px;
    height: 10px;
    border-radius: 50%;
    background: ${({ isOnline }) => isOnline ? '#44b700' : '#666'};
    border: 2px solid var(--bg-secondary);
    display: ${({ hideStatus }) => hideStatus ? 'none' : 'block'};
  }
`;

export default Chat;
