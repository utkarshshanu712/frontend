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

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    const savedProfilePic = localStorage.getItem(`profilePic_${username}`);
    if (savedProfilePic) setProfilePic(savedProfilePic);

    socket.on("users-update", (updatedUsers) => {
      setUsers(updatedUsers.filter((user) => user !== username));
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
      setDeletedMessages((prev) => new Set([...prev, messageId]));
    });

    return () => {
      socket.off("users-update");
      socket.off("chat-message");
      socket.off("private-message");
      socket.off("message-history");
      socket.off("password-change-success");
      socket.off("password-change-failed");
      socket.off("message-deleted");
    };
  }, [socket, username]);

  const sendMessage = (e) => {
    e.preventDefault();
    if (message.trim()) {
      const messagePayload = { message: message.trim() };
      if (selectedUser) {
        messagePayload.receiver = selectedUser;
        socket.emit("private-message", messagePayload);
      } else {
        socket.emit("send-message", messagePayload);
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
      const reader = new FileReader();
      reader.onloadend = () => {
        const imageData = reader.result;
        socket.emit("update-profile-pic", { username, profilePic: imageData });
        setProfilePic(imageData);
        localStorage.setItem(`profilePic_${username}`, imageData);
      };
      reader.readAsDataURL(file);
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
              style={{ display: "none" }}
            />
          </ProfilePicContainer>
          <Username>{username}</Username>
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
                onClick={() =>
                  setSelectedUser(user === selectedUser ? null : user)
                }
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
              placeholder={`Message ${selectedUser || "everyone"}...`}
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
          onSubmit={(oldPassword, newPassword) =>
            socket.emit("change-password", {
              username,
              oldPassword,
              newPassword,
            })
          }
        />
      )}
    </ChatContainer>
  );
}

import styled from "styled-components";

export const ChatContainer = styled.div`
  display: flex;
  flex-direction: column;
  height: 100vh;
  background-color: #f0f0f0;
  color: #333;
  font-family: Arial, sans-serif;
`;

export const Header = styled.header`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 20px;
  background-color: #3f51b5;
  color: white;
`;

export const UserInfo = styled.div`
  display: flex;
  align-items: center;
`;

export const ProfilePicContainer = styled.div`
  position: relative;
  margin-right: 10px;
`;

export const ProfilePic = styled.img`
  width: 50px;
  height: 50px;
  border-radius: 50%;
  object-fit: cover;
  border: 2px solid white;
`;

export const DefaultProfilePic = styled.div`
  width: 50px;
  height: 50px;
  border-radius: 50%;
  background-color: #ccc;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
  color: white;
  border: 2px solid white;
`;

export const CameraOverlay = styled.div`
  position: absolute;
  bottom: 0;
  right: 0;
  width: 20px;
  height: 20px;
  background-color: #fff;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #3f51b5;
  cursor: pointer;
`;

export const Username = styled.span`
  font-size: 18px;
  font-weight: bold;
`;

export const ButtonGroup = styled.div`
  display: flex;
  gap: 10px;
`;

export const Button = styled.button`
  padding: 5px 15px;
  font-size: 14px;
  background-color: #ffffff;
  color: #3f51b5;
  border: 1px solid #ffffff;
  border-radius: 3px;
  cursor: pointer;

  &:hover {
    background-color: #3f51b5;
    color: #fff;
    border: 1px solid #fff;
  }
`;

export const ChatLayout = styled.div`
  display: flex;
  height: 100%;
`;

export const Sidebar = styled.div`
  flex: 0 0 250px;
  background-color: #eeeeee;
  padding: 20px;
  overflow-y: auto;
  display: ${(props) => (props.isOpen ? "block" : "none")};
  transition: transform 0.3s;

  h3 {
    margin-bottom: 10px;
    color: #3f51b5;
  }
`;

export const UsersList = styled.ul`
  list-style: none;
  margin: 0;
  padding: 0;
`;

export const UserItem = styled.li`
  display: flex;
  align-items: center;
  padding: 10px;
  margin-bottom: 5px;
  background-color: ${(props) => (props.isSelected ? "#3f51b5" : "transparent")};
  color: ${(props) => (props.isSelected ? "white" : "#333")};
  border-radius: 5px;
  cursor: pointer;

  &:hover {
    background-color: #3f51b5;
    color: white;
  }
`;

export const UserAvatar = styled.div`
  width: 30px;
  height: 30px;
  border-radius: 50%;
  background-color: #ccc;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 10px;
  font-size: 16px;
  font-weight: bold;
  color: white;
`;

export const MessagesArea = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  background-color: #ffffff;
`;

export const MessagesContainer = styled.div`
  flex: 1;
  padding: 20px;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
`;

export const MessageBubble = styled.div`
  align-self: ${(props) => (props.isOwn ? "flex-end" : "flex-start")};
  max-width: 60%;
  padding: 10px;
  margin: 5px 0;
  border-radius: 10px;
  background-color: ${(props) =>
    props.isOwn ? "#d1e7ff" : props.isPrivate ? "#ffe4b5" : "#f1f1f1"};
  color: #333;
  position: relative;
`;

export const SenderName = styled.span`
  font-weight: bold;
  font-size: 12px;
`;

export const MessageText = styled.p`
  margin: 5px 0;
`;

export const TimeStamp = styled.span`
  font-size: 10px;
  color: #666;
  position: absolute;
  bottom: 5px;
  right: 10px;
`;

export const DeletedMessage = styled.span`
  font-style: italic;
  color: #999;
`;

export const MessageForm = styled.form`
  display: flex;
  align-items: center;
  padding: 10px;
  background-color: #f0f0f0;
`;

export const MessageInput = styled.input`
  flex: 1;
  padding: 10px;
  border: 1px solid #ccc;
  border-radius: 20px;
  outline: none;
  margin-right: 10px;
`;

export const SendButton = styled.button`
  background-color: #3f51b5;
  border: none;
  color: white;
  font-size: 18px;
  padding: 10px;
  border-radius: 50%;
  cursor: pointer;

  &:hover {
    background-color: #2c387e;
  }
`;

export const HamburgerButton = styled.button`
  background: none;
  border: none;
  color: white;
  font-size: 24px;
  cursor: pointer;

  &:hover {
    color: #dddddd;
  }
`;
export default Chat;
