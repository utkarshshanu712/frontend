import styled from 'styled-components';
import { IoCall, IoVideocam } from 'react-icons/io5';
import PropTypes from 'prop-types';

const ChatHeader = ({ selectedUser, onAudioCall, onVideoCall }) => {
  return (
    <HeaderContainer>
      <UserInfo>
        <span>{selectedUser}</span>
      </UserInfo>
      <CallButtons>
        <CallButton onClick={onAudioCall} aria-label="Audio Call">
          <IoCall />
        </CallButton>
        <CallButton onClick={onVideoCall} aria-label="Video Call">
          <IoVideocam />
        </CallButton>
      </CallButtons>
    </HeaderContainer>
  );
};

const HeaderContainer = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1rem;
  background: var(--bg-secondary);
  border-bottom: 1px solid var(--border-color);
`;

const UserInfo = styled.div`
  display: flex;
  align-items: center;
  gap: 1rem;
`;

const CallButtons = styled.div`
  display: flex;
  gap: 0.5rem;
`;

const CallButton = styled.button`
  background: var(--accent-color);
  border: none;
  color: white;
  width: 40px;
  height: 40px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s ease;
  
  &:hover {
    transform: scale(1.1);
    background: var(--hover-color);
  }

  svg {
    width: 20px;
    height: 20px;
  }
`;

ChatHeader.propTypes = {
  selectedUser: PropTypes.string.isRequired,
  onAudioCall: PropTypes.func.isRequired,
  onVideoCall: PropTypes.func.isRequired
};

export default ChatHeader; 