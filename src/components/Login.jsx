import { useState, useEffect } from 'react';
import styled from 'styled-components';

function Login({ socket, setUsername }) {
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    // Clear old stored credentials
    localStorage.removeItem('chatUser');
    localStorage.removeItem('chatAuth');
    
    // Load available users
    fetch(`${import.meta.env.VITE_API_URL}/users`)
      .then(res => {
        if (!res.ok) {
          throw new Error(`HTTP error! status: ${res.status}`);
        }
        return res.json();
      })
      .then(users => {
        setUsers(users);
        if (users.length > 0) {
          setSelectedUser(users[0].username);
        }
      })
      .catch(err => {
        console.error('Error loading users:', err);
        setError('Failed to load users. Please try again.');
      });
  }, []);

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');

    if (!selectedUser) {
      setError('Please select a user');
      return;
    }

    // Store credentials temporarily in sessionStorage
    sessionStorage.setItem('tempAuth', JSON.stringify({
      username: selectedUser,
      password
    }));

    socket.emit('auth', {
      username: selectedUser,
      password
    });

    setUsername(selectedUser);
  };

  return (
    <LoginContainer>
      <Logo src="./assets/trans1_480x480.png" alt="Friend Chat Logo" />
      <LoginForm onSubmit={handleSubmit}>
        <Logo src="assets/trans_480x480.png" alt="Friend Chat Logo" style={{ width: '80px', height: '80px' }} />
        <h2>Friend-Chat</h2>
        <select 
          value={selectedUser} 
          onChange={(e) => setSelectedUser(e.target.value)}
          required
        >
          <option value="">Select User</option>
          {users.map(user => (
            <option key={user.username} value={user.username}>
              {user.username}
            </option>
          ))}
        </select>
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        {error && <ErrorMessage>{error}</ErrorMessage>}
        <button type="submit">Join Chat</button>
      </LoginForm>
    </LoginContainer>
  );
}

const LoginContainer = styled.div`
  height: 100vh;
  width: 100vw;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  position: relative;
  overflow: hidden;

  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: linear-gradient(rgba(0, 0, 0, 0.7), rgba(0, 0, 0, 0.7)),
                url('https://images.unsplash.com/photo-1557683316-973673baf926?q=80&w=2029&auto=format&fit=crop');
    background-size: cover;
    background-position: center;
    background-attachment: fixed;
    z-index: -1;
  }
`;

const Logo = styled.img`
  width: 120px;
  height: 120px;
  margin-bottom: 2rem;
`;

const LoginForm = styled.form`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
  background: rgba(17, 27, 33, 0.8);
  backdrop-filter: blur(10px);
  padding: 2.5rem;
  border-radius: 15px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
  width: 90%;
  max-width: 400px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  
  h2 {
    color: var(--accent-color);
    margin-bottom: 1.5rem;
    text-align: center;
    font-size: 2rem;
  }
  
  input, select {
    padding: 0.8rem;
    border: 1px solid var(--border-color);
    border-radius: 8px;
    background: rgba(17, 27, 33, 0.6);
    color: var(--text-primary);
    font-size: 1rem;
    
    &::placeholder {
      color: var(--text-secondary);
    }
    
    &:focus {
      outline: none;
      border-color: var(--accent-color);
      box-shadow: 0 0 0 2px rgba(0, 168, 132, 0.2);
    }
  }
  
  button {
    background: var(--accent-color);
    color: var(--text-primary);
    border: none;
    padding: 0.8rem;
    border-radius: 8px;
    font-size: 1rem;
    cursor: pointer;
    transition: all 0.2s ease;
    
    &:hover {
      background: #00c49a;
      transform: translateY(-1px);
    }
    
    &:active {
      transform: translateY(0);
    }
  }
`;

const ErrorMessage = styled.p`
  color: var(--error-color);
  font-size: 0.9rem;
  margin-top: 0.5rem;
`;

export default Login; 
