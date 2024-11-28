import { useState, useEffect, useRef } from "react";
import styled from "styled-components";
import {
  IoSend,
  IoAttach,
  IoCamera,
  IoClose,
  IoMenu,
  IoPeople,
} from "react-icons/io5";
import PasswordChangeModal from "./PasswordChangeModal";
import logoImage from "../assets/orig_600x600-removebg-preview.png";

const createChatId = (user1, user2) => {
  return [user1, user2].sort().join("_");
};

const DeleteButton = styled.button`
  position: absolute;
  top: -8px;
  right: -8px;
  width: 20px;
  height: 20px;
  border-radius: 50%;
  background: var(--bg-secondary);
  color: var(--text-primary);
  border: none;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0;
  visibility: hidden;
  transition: opacity 0.2s ease;
  z-index: 2;

  &:hover {
    background: #ff4444;
  }
`;

const MessageBubble = styled.div`
  position: relative;
  padding: 0.8rem 1rem;
  border-radius: 8px;
  max-width: 70%;
  word-wrap: break-word;
  margin: 0.5rem 0;
  background: ${(props) =>
    props.isOwn ? "var(--message-out)" : "var(--message-in)"};
  align-self: ${(props) => (props.isOwn ? "flex-end" : "flex-start")};

  &:hover ${DeleteButton} {
    opacity: 1;
    visibility: visible;
  }
`;

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
  const profilePicInputRef = useRef(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [chatHistory, setChatHistory] = useState({});
  const [activeSection, setActiveSection] = useState("private"); // 'private' or 'group'
  const [unreadCounts, setUnreadCounts] = useState({});
  const [notifications, setNotifications] = useState([]);
  const [lastReadTimestamps, setLastReadTimestamps] = useState({});

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (messagesEndRef.current) {
      const smoothScroll = () => {
        messagesEndRef.current.scrollIntoView({
          behavior: "smooth",
          block: "end",
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
      .then((res) => res.json())
      .then((allUsers) => {
        // Filter out current user and ensure all users have required properties
        const filteredUsers = allUsers
          .filter((user) => user && user.username && user.username !== username)
          .map((user) => ({
            ...user,
            profilePic: user.profilePic || null,
          }));
        setUsers(filteredUsers);
      })
      .catch((err) => {
        console.error("Error fetching users:", err);
        setUsers([]); // Set empty array on error
      });

    // Handle online users updates
    socket.on("users-update", (updatedUsers) => {
      setOnlineUsers(updatedUsers.filter((user) => user !== username));
    });

    socket.on("chat-message", (message) => {
      setMessages((prev) => [...prev, message]);
    });

    socket.on("private-message", (message) => {
      setMessages((prev) => [...prev, { ...message, isPrivate: true }]);
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
      setMessages((prevMessages) =>
        prevMessages.filter((msg) => msg._id !== messageId)
      );

      // Clean up any references in deletedMessages set
      setDeletedMessages((prev) => {
        const newSet = new Set(prev);
        newSet.delete(messageId);
        return newSet;
      });
    });

    socket.on("profile-pic-updated", ({ success, profilePic, error }) => {
      if (success) {
        setProfilePic(profilePic);
        localStorage.setItem(`profilePic_${username}`, profilePic);
        alert("Profile picture updated successfully!");
      } else {
        alert(`Failed to update profile picture: ${error}`);
      }
    });

    socket.on(
      "user-profile-updated",
      ({ username: updatedUser, profilePic }) => {
        // Update the user's profile pic in the UI
        setUsers((prevUsers) =>
          prevUsers.map((user) =>
            user.username === updatedUser ? { ...user, profilePic } : user
          )
        );
      }
    );

    socket.on("receive-message", (message) => {
      if (message.receiver) {
        const chatId = createChatId(message.sender, message.receiver);
        
        // Only update unread count if message is not from current user and not in current chat
        if (message.sender !== username && selectedUser !== message.sender) {
          setUnreadCounts(prev => ({
            ...prev,
            [chatId]: (prev[chatId] || 0) + 1
          }));

          // Show notification
          if (Notification.permission === "granted") {
            new Notification("New Message", {
              body: `${message.sender}: ${message.message.substring(0, 50)}${message.message.length > 50 ? '...' : ''}`,
              icon: "/src/assets/trans1_480x480.png"
            });
          }
        }

        setChatHistory(prev => {
          const existingMessages = prev[chatId] || [];
          const exists = existingMessages.some(m => m._id === message._id);
          if (exists) return prev;

          return {
            ...prev,
            [chatId]: [...existingMessages, message]
          };
        });
      } else {
        // Broadcast message
        setMessages(prev => {
          const exists = prev.some(m => m._id === message._id);
          return exists ? prev : [...prev, message];
        });
      }
    });

    socket.on("receive-file", (fileMessage) => {
      setMessages((prev) => [...prev, fileMessage]);
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

    // Request notification permission
    if ('Notification' in window) {
      Notification.requestPermission();
    }

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

  useEffect(() => {
    if (selectedUser) {
      const chatId = createChatId(username, selectedUser);

      // Load chat history if not already loaded
      if (!chatHistory[chatId]) {
        fetch(`${import.meta.env.VITE_API_URL}/api/messages/${chatId}`)
          .then((res) => res.json())
          .then((messages) => {
            setChatHistory((prev) => ({
              ...prev,
              [chatId]: messages,
            }));
          })
          .catch(console.error);
      }

      // Cleanup function
      return () => {
        if (chatHistory[chatId]) {
          // Save current chat history to localStorage
          localStorage.setItem(
            `chat_history_${chatId}`,
            JSON.stringify(chatHistory[chatId])
          );
        }
      };
    }
  }, [selectedUser, username]);

  const sendMessage = (e) => {
    e.preventDefault();
    if (message.trim()) {
      const chatId = selectedUser
        ? createChatId(username, selectedUser)
        : "broadcast";
      const messageData = {
        sender: username,
        receiver: selectedUser,
        message: message.trim(),
        chatId,
        timestamp: new Date(),
      };

      socket.emit("send-message", messageData);
      setMessage("");
    }
  };

  const handleDeleteMessage = (messageId) => {
    socket.emit("delete-message", { messageId });

    if (selectedUser) {
      const chatId = createChatId(username, selectedUser);
      setChatHistory((prev) => ({
        ...prev,
        [chatId]: prev[chatId].filter((msg) => msg._id !== messageId),
      }));
    } else {
      setMessages((prev) => prev.filter((msg) => msg._id !== messageId));
    }
  };

  const handleProfilePicChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Check file size (limit to 2MB for profile pics)
    if (file.size > 2 * 1024 * 1024) {
      alert("Profile picture must be less than 2MB");
      return;
    }

    // Verify it's an image
    if (!file.type.startsWith("image/")) {
      alert("Please select an image file");
      return;
    }

    const reader = new FileReader();
    reader.onload = async (event) => {
      const profilePicData = event.target.result;
      socket.emit("update-profile-pic", {
        username,
        profilePic: profilePicData,
      });
    };
    reader.readAsDataURL(file);

    // Clear the input
    e.target.value = "";
  };

  const validateFileType = (file) => {
    const allowedTypes = [
      "image/",
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "text/plain",
      "application/vnd.ms-excel",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    ];
    return allowedTypes.some((type) => file.type.startsWith(type));
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!validateFileType(file)) {
      alert(
        "Invalid file type. Please upload images, PDFs, Word documents, Excel sheets, or text files."
      );
      return;
    }

    // Check file size (limit to 50MB)
    if (file.size > 50 * 1024 * 1024) {
      alert("File size must be less than 50MB");
      return;
    }

    const reader = new FileReader();
    reader.onload = async (event) => {
      const fileData = {
        name: file.name,
        type: file.type,
        data: event.target.result,
        size: file.size,
      };

      const chatId = selectedUser
        ? createChatId(username, selectedUser)
        : "broadcast";
      const messageData = {
        sender: username,
        receiver: selectedUser,
        message: `File: ${file.name}`,
        isFile: true,
        fileData: fileData,
        chatId,
        timestamp: new Date(),
      };

      socket.emit("send-message", messageData);
    };
    reader.readAsDataURL(file);
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage(e);
    }
  };

  const displayMessages = selectedUser
    ? chatHistory[[username, selectedUser].sort().join("_")] || []
    : messages.filter((msg) => !msg.receiver);

  const renderUserList = () => {
    return privateChatUsers.map(user => {
      const chatId = createChatId(username, user);
      const unreadCount = unreadCounts[chatId] || 0;
      
      return (
        <UserListItem
          key={user}
          onClick={() => {
            setSelectedUser(user);
            setUnreadCounts(prev => ({
              ...prev,
              [chatId]: 0
            }));
            socket.emit("mark-messages-read", { chatId, reader: username });
          }}
        >
          <UserAvatar 
            isOnline={onlineUsers.includes(user)} 
            hideStatus={false}
          />
          <UserInfo>
            <span>{user}</span>
            {unreadCount > 0 && (
              <UnreadBadge>{unreadCount}</UnreadBadge>
            )}
          </UserInfo>
        </UserListItem>
      );
    });
  };

  const updateUnreadCount = (chatId, increment = true) => {
    setUnreadCounts(prev => ({
      ...prev,
      [chatId]: increment ? (prev[chatId] || 0) + 1 : 0
    }));
  };

  const markMessagesAsRead = (chatId) => {
    setUnreadCounts(prev => ({
      ...prev,
      [chatId]: 0
    }));
    socket.emit("mark-messages-read", { chatId, reader: username });
  };

  const handleUserSelect = (user) => {
    const chatId = createChatId(username, user);
    setSelectedUser(user);
    markMessagesAsRead(chatId);
    
    // Save last read timestamp
    setLastReadTimestamps(prev => ({
      ...prev,
      [chatId]: Date.now()
    }));

    // Request notification permission if not already granted
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  };

  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

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
            <CameraOverlay onClick={() => profilePicInputRef.current?.click()}>
              <IoCamera />
            </CameraOverlay>
            <input
              type="file"
              ref={profilePicInputRef}
              style={{ display: "none" }}
              onChange={handleProfilePicChange}
              accept="image/*"
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

        <MessagesArea isSidebarOpen={isSidebarOpen}>
          <MessagesContainer>
            {displayMessages.map((msg, index) => (
              <MessageBubble
                key={msg._id || index}
                isOwn={msg.sender === username}
              >
                {msg.sender !== username && (
                  <SenderName>{msg.sender}</SenderName>
                )}
                {msg.isFile ? (
                  <FileContent>
                    {msg.fileData.type.startsWith("image/") ? (
                      <img
                        src={msg.fileData.data}
                        alt={msg.fileData.name}
                        style={{ maxWidth: "200px", maxHeight: "200px" }}
                      />
                    ) : (
                      <a
                        href={msg.fileData.data}
                        download={msg.fileData.name}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        Download: {msg.fileData.name}
                      </a>
                    )}
                  </FileContent>
                ) : (
                  msg.message
                )}
                <TimeStamp>
                  {new Date(msg.timestamp).toLocaleTimeString()}
                </TimeStamp>
                {msg.sender === username && (
                  <DeleteButton onClick={() => handleDeleteMessage(msg._id)}>
                    <IoClose size={14} />
                  </DeleteButton>
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
              placeholder={`Message ${selectedUser || "everyone"}...`}
            />
            <AttachButton onClick={() => fileInputRef.current.click()}>
              <IoAttach />
            </AttachButton>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileUpload}
              style={{ display: "none" }}
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
              newPassword,
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
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  overflow: hidden;
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
  display: flex;
  height: calc(100vh - 70px);
  position: relative;
  overflow: hidden;

  @media (max-width: 768px) {
    height: calc(100vh - 60px);
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
    transform: ${({ isOpen }) =>
      isOpen ? "translateX(0)" : "translateX(-100%)"};
    z-index: 10;
  }
`;

const UserInfo = styled.div`
  display: flex;
  align-items: center;
  flex: 1;
  margin-left: 12px;
  justify-content: space-between;
  
  span {
    flex: 1;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
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
  background: #111b21;
  color: #ffffff;
  display: flex;
  align-items: center;
  justify-content: center;
`;

const CameraOverlay = styled.div`
  position: absolute;
  bottom: -5px;
  right: -5px;
  background: #111b21;
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
  background: #111b21;
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
  background: ${({ isSelected }) =>
    isSelected ? "var(--hover-color)" : "transparent"};

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

  @media (max-width: 768px) {
    padding-bottom: 110px; // Increased padding to prevent hiding behind the message writing area
    height: calc(100vh - 130px);
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
  align-items: center;
  gap: 0.5rem;
  padding: 1rem;
  background: var(--bg-secondary);
  position: sticky;
  bottom: 0;
  width: 100%;

  @media (max-width: 768px) {
    position: fixed;
    bottom: 0;
    left: 0;
    padding: 0.8rem;
  }
`;

const MessageInput = styled.textarea`
  flex: 1;
  padding: 0.8rem;
  border: 1px solid #111b21;
  border-radius: 20px;
  background: #111b21;
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
    background: #111b21;
    border-radius: 2px;
  }

  &::placeholder {
    color: #a0a0a0;
  }

  &:focus {
    border-color: #202c33;
  }
`;

const SendButton = styled.button`
  background: #111b21;
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
    background: #202c33;
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
    color: #202c33;
  }
`;

const DeletedMessage = styled.div`
  font-style: italic;
  color: #a0a0a0;
  font-size: 0.9rem;
`;

const MessagesArea = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  background: linear-gradient(rgba(0, 0, 0, 0.7), rgba(0, 0, 0, 0.7)),
    url("https://w0.peakpx.com/wallpaper/901/891/HD-wallpaper-pattern-black-dark-grey-shape-thumbnail.jpg");
  background-repeat: repeat;
  background-size: 200px;
  padding: 1rem;
  overflow-y: auto;
  position: relative;

  &::-webkit-scrollbar {
    width: 6px;
  }

  &::-webkit-scrollbar-track {
    background: var(--bg-secondary);
  }

  &::-webkit-scrollbar-thumb {
    background: var(--accent-color);
    border-radius: 3px;
  }
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
  background: ${({ hasImage }) => (hasImage ? "none" : "var(--accent-color)")};
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 1rem;
  overflow: hidden;
  position: relative;
  background-image: ${({ profilePic }) =>
    profilePic ? `url(${profilePic})` : "none"};
  background-size: cover;
  background-position: center;

  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  &::after {
    content: "";
    position: absolute;
    bottom: 2px;
    right: 2px;
    width: 10px;
    height: 10px;
    border-radius: 50%;
    background: ${({ isOnline }) => (isOnline ? "#44b700" : "#666")};
    border: 2px solid var(--bg-secondary);
    display: ${({ hideStatus }) => (hideStatus ? "none" : "block")};
  }
`;

const FileContent = styled.div`
  margin-bottom: 0.5rem;
`;

const UserListItem = styled.div`
  display: flex;
  align-items: center;
  padding: 0.8rem 1rem;
  cursor: pointer;
  position: relative;

  &:hover {
    background: var(--hover-color);
  }
`;

const UnreadBadge = styled.span`
  background: var(--accent-color);
  color: white;
  border-radius: 50%;
  min-width: 20px;
  height: 20px;
  padding: 0 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  margin-left: 8px;
`;

export default Chat;
