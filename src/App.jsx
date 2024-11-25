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
<<<<<<< HEAD
  const [isOffline, setIsOffline] = useState(false);
=======
>>>>>>> cea482f091dad818d08f257b4b2eb6dcaaef1337
  const [username, setUsername] = useState(() => {
    const auth = localStorage.getItem('chatAuth');
    return auth ? JSON.parse(auth).username : "";
  });

  useEffect(() => {
    const storedAuth = localStorage.getItem('chatAuth');
    if (storedAuth) {
      const { username: storedUsername, password } = JSON.parse(storedAuth);
      setUsername(storedUsername);
      socket.emit('auth', { username: storedUsername, password });
    }

    socket.on("auth-success", () => {
      setIsAuthenticated(true);
    });

    socket.on("auth-failed", () => {
      localStorage.removeItem('chatAuth');
      alert("Invalid password!");
    });

    socket.on("connect", () => {
<<<<<<< HEAD
      setIsOffline(false);
=======
>>>>>>> cea482f091dad818d08f257b4b2eb6dcaaef1337
      const auth = localStorage.getItem('chatAuth');
      if (auth) {
        const { username, password } = JSON.parse(auth);
        socket.emit('auth', { username, password });
      }
    });

<<<<<<< HEAD
    socket.on("connect_error", () => {
      setIsOffline(true);
    });

=======
>>>>>>> cea482f091dad818d08f257b4b2eb6dcaaef1337
    return () => {
      socket.off("auth-success");
      socket.off("auth-failed");
      socket.off("connect");
<<<<<<< HEAD
      socket.off("connect_error");
=======
>>>>>>> cea482f091dad818d08f257b4b2eb6dcaaef1337
    };
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('chatAuth');
    setIsAuthenticated(false);
    setUsername("");
    socket.disconnect();
    window.location.reload();
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
  display: flex;
  justify-content: center;
  align-items: center;
  background-color: var(--bg-primary);
  
  @media (max-width: 768px) {
    padding: 0;
  }
`;

export default App;
