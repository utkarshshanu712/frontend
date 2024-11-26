import { useState } from 'react';
import styled from 'styled-components';

function PasswordChangeModal({ onClose, onSubmit }) {
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(oldPassword, newPassword);
  };

  return (
    <ModalOverlay>
      <ModalContent>
        <h3>Change Password</h3>
        <form onSubmit={handleSubmit}>
          <input
            type="password"
            placeholder="Current Password"
            value={oldPassword}
            onChange={(e) => setOldPassword(e.target.value)}
            required
          />
          <input
            type="password"
            placeholder="New Password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            required
          />
          <ButtonGroup>
            <Button type="submit">Change Password</Button>
            <Button type="button" onClick={onClose}>Cancel</Button>
          </ButtonGroup>
        </form>
      </ModalContent>
    </ModalOverlay>
  );
}

const ModalOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
`;

const ModalContent = styled.div`
  background: var(--bg-secondary);
  padding: 2rem;
  border-radius: 8px;
  width: 90%;
  max-width: 400px;

  h3 {
    margin-bottom: 1rem;
    color: var(--text-primary);
  }

  input {
    width: 100%;
    padding: 0.8rem;
    margin-bottom: 1rem;
    border: 1px solid var(--border-color);
    border-radius: 4px;
    background: var(--bg-primary);
    color: var(--text-primary);
  }
`;

const ButtonGroup = styled.div`
  display: flex;
  gap: 1rem;
  justify-content: flex-end;
`;

const Button = styled.button`
  padding: 0.5rem 1rem;
  border: none;
  border-radius: 4px;
  background: var(--accent-color);
  color: var(--text-primary);
  cursor: pointer;

  &:hover {
    opacity: 0.9;
  }
`;

export default PasswordChangeModal; 