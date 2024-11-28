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
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    const auth = localStorage.getItem('chatAuth');
    return !!auth;
  });
  const [isOffline, setIsOffline] = useState(false);
  const [username, setUsername] = useState(() => {
    const auth = localStorage.getItem('chatAuth');
    return auth ? JSON.parse(auth).username : "";
  });

  useEffect(() => {
    const storedAuth = localStorage.getItem('chatAuth');
    if (storedAuth) {
      const { username, password } = JSON.parse(storedAuth);
      socket.emit('auth', { username, password });
    }

    socket.on("auth-success", ({ username }) => {
      setIsAuthenticated(true);
      if (!localStorage.getItem('chatAuth')) {
        const tempAuth = JSON.parse(sessionStorage.getItem('tempAuth') || '{}');
        if (tempAuth.username && tempAuth.password) {
          localStorage.setItem('chatAuth', JSON.stringify(tempAuth));
        }
      }
    });

    socket.on("auth-failed", () => {
      setIsAuthenticated(false);
      localStorage.removeItem('chatAuth');
      sessionStorage.removeItem('tempAuth');
      alert("Authentication failed. Please login again.");
    });

    socket.on("connect", () => {
      const auth = localStorage.getItem('chatAuth');
      if (auth) {
        const { username, password } = JSON.parse(auth);
        socket.emit('auth', { username, password });
      }
    });

    socket.on("disconnect", () => {
      setIsOffline(true);
    });

    return () => {
      socket.off("auth-success");
      socket.off("auth-failed");
      socket.off("connect");
      socket.off("disconnect");
    };
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('chatAuth');
    sessionStorage.removeItem('tempAuth');
    setIsAuthenticated(false);
    setUsername("");
    socket.disconnect();
    socket.connect();
  };

  return (
    <AppContainer>
      {!isAuthenticated ? (
        <Login socket={socket} setUsername={setUsername} />
      ) : (
        <Chat socket={socket} username={username} onLogout={handleLogout} />
      )}
    </AppContainer>
  );
}

const AppContainer = styled.div`
  height: 100vh;
  width: 100vw;
  max-width: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
  background-color: var(--bg-primary);
  padding: 0;
  margin: 0;
  
  @media (min-width: 1024px) {
    padding: 20px;
    & > * {
      width: 100%;
      max-width: 1400px;
      height: calc(100vh - 40px);
      border-radius: 12px;
      overflow: hidden;
    }
  }
  
  @media (max-width: 768px) {
    padding: 0;
    height: 100vh;
    & > * {
      width: 100%;
      height: 100%;
    }
  }
`;

export default App;
