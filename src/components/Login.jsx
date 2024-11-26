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
      <LoginForm onSubmit={handleSubmit}>
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
  background-image: url('https://images.unsplash.com/photo-1506748686214-e9df14d4d9d0?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=MnwzNjUyOXwwfDF8c2VhcmNofDF8fGJhY2tncm91bmQlMjBpbWFnZXxlbnwwfHx8fDE2MzY5MjY0MjM&ixlib=rb-1.2.1&q=80&w=1080');
  background-size: cover;
  background-position: center;
  background-attachment: fixed;
  padding: 2rem;
  border-radius: 10px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.2);
  width: 90%;
  max-width: 400px;
  margin: auto;
  
  h2 {
    color: var(--accent-color);
    margin-bottom: 1.5rem;
    text-align: center;
  }
`;

const LoginForm = styled.form`
  display: flex;
  flex-direction: column;
  gap: 1rem;
  
  input {
    padding: 0.8rem;
    border: 1px solid var(--border-color);
    border-radius: 8px;
    background: var(--bg-primary);
    color: var(--text-primary);
    font-size: 1rem;
    
    &::placeholder {
      color: var(--text-secondary);
    }
    
    &:focus {
      outline: none;
      border-color: var(--accent-color);
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
    transition: opacity 0.2s;
    
    &:hover {
      opacity: 0.9;
    }
  }
`;

const ErrorMessage = styled.p`
  color: var(--error-color);
  font-size: 0.9rem;
  margin-top: 0.5rem;
`;

export default Login; 
