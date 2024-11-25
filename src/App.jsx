import { useState, useEffect } from "react";
import styled from "styled-components";
import io from "socket.io-client";
import Login from "./components/Login";
import Chat from "./components/Chat";

const socket = io(import.meta.env.VITE_API_URL, {
  transports: ['websocket'],
  reconnection: true,
  reconnectionAttempts: 5,
  reconnectionDelay: 1000
});


function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [username, setUsername] = useState("");

  useEffect(() => {
    console.log('Socket connected:', socket.id);
    socket.on("auth-success", () => {
      setIsAuthenticated(true);
    });

    socket.on("auth-failed", () => {
      alert("Invalid password!");
    });

    return () => {
      socket.off("auth-success");
      socket.off("auth-failed");
    };
  }, []);

  return (
    <AppContainer>
      {!isAuthenticated ? (
        <Login socket={socket} setUsername={setUsername} />
      ) : (
        <Chat socket={socket} username={username} />
      )}
    </AppContainer>
  );
}

const AppContainer = styled.div`
  height: 100vh;
  display: flex;
  justify-content: center;
  align-items: center;
  background-color: var(--bg-primary);
  
  @media (max-width: 768px) {
    padding: 0;
  }
`;

export default App;
