import styled from 'styled-components';
import { IoCall, IoVideocam } from 'react-icons/io5';
import { useState, useRef, useEffect } from 'react';

const ChatHeader = ({ selectedUser, onAudioCall, onVideoCall }) => {
  const [callDuration, setCallDuration] = useState(0);
  const timerRef = useRef(null);
  const [isInCall, setIsInCall] = useState(false);

  useEffect(() => {
    if (isInCall) {
      timerRef.current = setInterval(() => {
        setCallDuration(prev => prev + 1);
      }, 1000);
    }
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        setCallDuration(0);
      }
    };
  }, [isInCall]);

  return (
    <HeaderContainer>
      <UserInfo>
        <span>{selectedUser}</span>
        {isInCall && (
          <CallTimer>
            {Math.floor(callDuration / 60)}:{(callDuration % 60).toString().padStart(2, '0')}
          </CallTimer>
        )}
      </UserInfo>
      <CallButtons>
        <CallButton onClick={onAudioCall}>
          <IoCall />
        </CallButton>
        <CallButton onClick={onVideoCall}>
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
  gap: 1rem;
`;

const CallButton = styled.button`
  background: transparent;
  border: none;
  color: var(--accent-color);
  font-size: 1.2rem;
  cursor: pointer;
  padding: 0.5rem;
  border-radius: 50%;
  
  &:hover {
    background: var(--hover-color);
  }
`;

const CallTimer = styled.span`
  font-size: 0.9rem;
  color: var(--text-secondary);
  margin-left: 1rem;
`;

export default ChatHeader; 