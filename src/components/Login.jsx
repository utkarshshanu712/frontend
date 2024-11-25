import { useState } from 'react';
import styled from 'styled-components';

function Login({ socket, setUsername }) {
  const [formData, setFormData] = useState({
    username: '',
    password: ''
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    socket.emit('auth', formData);
    setUsername(formData.username);
  };

  return (
    <LoginContainer>
      <LoginForm onSubmit={handleSubmit}>
        <h2>Friend-Chat</h2>
        <input
          type="text"
          placeholder="Username"
          value={formData.username}
          onChange={(e) => setFormData({ ...formData, username: e.target.value })}
          required
        />
        <input
          type="password"
          placeholder="Password"
          value={formData.password}
          onChange={(e) => setFormData({ ...formData, password: e.target.value })}
          required
        />
        <button type="submit">Join Chat</button>
      </LoginForm>
    </LoginContainer>
  );
}

const LoginContainer = styled.div`
  background: var(--bg-secondary);
  padding: 2rem;
  border-radius: 10px;
  box-shadow: 0 2px 10px rgba(0,0,0,0.2);
  width: 90%;
  max-width: 400px;
  
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

export default Login; 