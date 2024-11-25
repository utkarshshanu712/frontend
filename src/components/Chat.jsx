import { useState, useEffect, useRef } from "react";
import styled from "styled-components";
import { IoSend, IoAttach } from "react-icons/io5";

function Chat({ socket, username, onLogout }) {
  const [message, setMessage] = useState("");
  const [isOffline, setIsOffline] = useState(false);
  const [messages, setMessages] = useState(() => {
    const savedMessages = localStorage.getItem("chatMessages");
    return savedMessages ? JSON.parse(savedMessages) : [];
  });
  const [users, setUsers] = useState([]);
  const [selectedRecipient, setSelectedRecipient] = useState("All");
  const fileInputRef = useRef(null);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    localStorage.setItem("chatMessages", JSON.stringify(messages));
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const handleFileSelect = async (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const fileData = {
          name: file.name,
          type: file.type,
          data: event.target.result,
          recipient: selectedRecipient === "All" ? null : selectedRecipient,
        };
        socket.emit("send-file", fileData);
      };
      reader.readAsDataURL(file);
    }
  };

  useEffect(() => {
    socket.on("use-local-storage", () => {
      setIsOffline(true);
      const savedMessages = localStorage.getItem("chatMessages");
      if (savedMessages) {
        setMessages(JSON.parse(savedMessages));
      }
    });

    socket.on("receive-message", (msg) => {
      setMessages((prev) => {
        const newMessages = [...prev, msg];
        if (isOffline) {
          localStorage.setItem("chatMessages", JSON.stringify(newMessages));
        }
        return newMessages;
      });
    });

    socket.on("receive-file", (fileData) => {
      setMessages((prev) => [
        ...prev,
        {
          ...fileData,
          isFile: true,
          timestamp: new Date().toISOString(),
        },
      ]);
    });

    socket.on("users-update", (updatedUsers) => {
      setUsers(["All", ...updatedUsers]);
    });

    socket.on("message-history", (history) => {
      setMessages(history);
    });

    return () => {
      socket.off("use-local-storage");
      socket.off("receive-message");
      socket.off("receive-file");
      socket.off("users-update");
      socket.off("message-history");
    };
  }, [socket, isOffline]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const sendMessage = (e) => {
    e.preventDefault();
    if (message.trim()) {
      socket.emit("send-message", {
        message: message.trim(),
        username,
        recipient: selectedRecipient === "All" ? null : selectedRecipient,
        timestamp: new Date().toISOString(),
      });
      setMessage("");
    }
  };

  const renderMessage = (msg) => {
    if (msg.isFile) {
      if (msg.type.startsWith("image/")) {
        return <FileImage src={msg.data} alt={msg.name} />;
      }
      return (
        <FileDownload href={msg.data} download={msg.name}>
          📎 {msg.name}
        </FileDownload>
      );
    }
    return <MessageText>{msg.message}</MessageText>;
  };

  return (
    <ChatContainer>
      <LogoutButton onClick={onLogout}>Logout</LogoutButton>
      <UsersPanel>
        <h3>Recipients</h3>
        <UsersList>
          {users.map((user, index) => (
            <UserItem
              key={index}
              onClick={() => setSelectedRecipient(user)}
              isSelected={selectedRecipient === user}
            >
              {user}
            </UserItem>
          ))}
        </UsersList>
      </UsersPanel>

      <ChatMain>
        <MessagesContainer>
          {messages.map((msg, index) => (
            <MessageBubble key={index} isOwn={msg.username === username}>
              <Username>
                {msg.recipient ? `${msg.username} ➡️ ${msg.recipient}` : msg.username}
              </Username>
              {renderMessage(msg)}
              <Timestamp>
                {new Date(msg.timestamp).toLocaleTimeString()}
              </Timestamp>
            </MessageBubble>
          ))}
          <div ref={messagesEndRef} />
        </MessagesContainer>

        <MessageForm onSubmit={sendMessage}>
          <FileInput
            type="file"
            ref={fileInputRef}
            onChange={handleFileSelect}
            accept="image/*,.pdf,.doc,.docx"
          />
          <AttachButton
            type="button"
            onClick={() => fileInputRef.current?.click()}
          >
            <IoAttach />
          </AttachButton>
          <MessageInput
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Type a message..."
          />
          <SendButton type="submit">
            <IoSend />
          </SendButton>
        </MessageForm>
      </ChatMain>
    </ChatContainer>
  );
}

// Rest of the styled components remain unchanged

const UserItem = styled.div`
  padding: 0.8rem;
  border-radius: 8px;
  margin-bottom: 0.5rem;
  background: ${(props) =>
    props.isSelected ? "var(--accent-color)" : "var(--bg-primary)"};
  color: var(--text-primary);
  cursor: pointer;
  transition: background 0.2s;

  &:hover {
    background: var(--hover-color);
  }
`;

export default Chat;
