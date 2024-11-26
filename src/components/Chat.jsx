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
            {selectedUser ? (
              messages.filter(msg => msg.receiver === selectedUser || msg.sender === selectedUser)
                      .map((msg, index) => (
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
                      ))
            ) : (
              messages.map((msg, index) => (
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
              ))
            )}
            <div ref={messagesEndRef} />
          </MessagesContainer>
        </MessagesArea>

        <InputArea>
          <TextArea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={handleKeyPress}
            placeholder="Type a message..."
          />
          <SendButton onClick={sendMessage}>
            <IoSend />
          </SendButton>
          <AttachButton>
            <label>
              <IoAttach />
              <input type="file" onChange={handleFileUpload} style={{ display: "none" }} />
            </label>
          </AttachButton>
        </InputArea>
      </ChatLayout>

      {showPasswordChange && (
        <PasswordChangeModal
          onClose={() => setShowPasswordChange(false)}
          username={username}
          socket={socket}
        />
      )}
    </ChatContainer>
  );
}

export default Chat;
