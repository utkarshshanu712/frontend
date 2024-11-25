<<<<<<< HEAD
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
=======
import { useState, useEffect } from "react";
import styled from "styled-components";

function Login({ socket, setUsername }) {
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    // Clear old stored credentials
    localStorage.removeItem("chatUser");
    localStorage.removeItem("chatAuth");

    // Load available users
    fetch(`${import.meta.env.VITE_API_URL}/users`)
      .then((res) => res.json())
      .then((users) => {
>>>>>>> 4c0971b0b8eace7c6bcea4d9daa72477f81aa548
        setUsers(users);
        if (users.length > 0) {
          setSelectedUser(users[0].username);
        }
      })
<<<<<<< HEAD
      .catch(err => {
        console.error('Error loading users:', err);
        setError('Failed to load users. Please try again.');
=======
      .catch((err) => {
        console.error("Error loading users:", err);
        setError("Failed to load users. Please try again.");
>>>>>>> 4c0971b0b8eace7c6bcea4d9daa72477f81aa548
      });
  }, []);

  const handleSubmit = (e) => {
    e.preventDefault();
<<<<<<< HEAD
    setError('');

    if (!selectedUser) {
      setError('Please select a user');
      return;
    }

    socket.emit('auth', {
      username: selectedUser,
      password
=======
    setError("");

    if (!selectedUser) {
      setError("Please select a user");
      return;
    }

    socket.emit("auth", {
      username: selectedUser,
      password,
>>>>>>> 4c0971b0b8eace7c6bcea4d9daa72477f81aa548
    });

    setUsername(selectedUser);
  };

  return (
    <LoginContainer>
      <LoginForm onSubmit={handleSubmit}>
        <h2>Friend-Chat</h2>
<<<<<<< HEAD
        <select 
          value={selectedUser} 
=======
        <select
          value={selectedUser}
>>>>>>> 4c0971b0b8eace7c6bcea4d9daa72477f81aa548
          onChange={(e) => setSelectedUser(e.target.value)}
          required
        >
          <option value="">Select User</option>
<<<<<<< HEAD
          {users.map(user => (
=======
          {users.map((user) => (
>>>>>>> 4c0971b0b8eace7c6bcea4d9daa72477f81aa548
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
  background: var(--bg-secondary);
  padding: 2rem;
  border-radius: 10px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.2);
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

const ErrorMessage = styled.p`
  color: var(--error-color);
  font-size: 0.9rem;
  margin-top: 0.5rem;
`;

<<<<<<< HEAD
export default Login; 
=======
export default Login;
>>>>>>> 4c0971b0b8eace7c6bcea4d9daa72477f81aa548
