import styled from "styled-components";

export const MessageBubble = styled.div`
  position: relative;
  padding: 0.8rem 1rem;
  border-radius: 8px;
  max-width: 70%;
  word-wrap: break-word;
  margin: 0.5rem 0;
  background: ${props => props.isOwn ? 'var(--message-out)' : 'var(--message-in)'};
  align-self: ${props => props.isOwn ? 'flex-end' : 'flex-start'};
  min-width: 80px;
`;

export const UserAvatar = styled.div`
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: ${({ hasImage }) => hasImage ? 'none' : 'var(--accent-color)'};
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 1rem;
  overflow: hidden;
  position: relative;
  background-image: ${({ profilePic }) => profilePic ? `url(${profilePic})` : 'none'};
  background-size: cover;
  background-position: center;

  &::after {
    content: '';
    position: absolute;
    bottom: 2px;
    right: 2px;
    width: 10px;
    height: 10px;
    border-radius: 50%;
    background: ${({ isOnline }) => isOnline ? '#44b700' : '#666'};
    border: 2px solid var(--bg-secondary);
    display: ${({ hideStatus }) => hideStatus ? 'none' : 'block'};
  }
`;

// Export other styled components... 