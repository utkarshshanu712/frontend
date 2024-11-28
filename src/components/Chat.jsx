import { useState, useEffect, useRef } from "react";
import styled from "styled-components";
import { IoSend, IoAttach, IoCamera, IoClose, IoMenu, IoPeople } from "react-icons/io5";
import PasswordChangeModal from "./PasswordChangeModal";
import logoImage from '../assets/orig_600x600-removebg-preview.png';

const ChatContainer = styled.div`
  display: flex;
  height: 100vh;
  background: var(--bg-primary);
  position: relative;
  max-width: 1920px;
  margin: 0 auto;

  @media (min-width: 1024px) {
    height: calc(100vh - 40px);
    margin: 20px auto;
    border-radius: 12px;
    overflow: hidden;
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.2);
  }
`;

const Sidebar = styled.div`
  width: 350px;
  background: var(--bg-secondary);
  border-right: 1px solid var(--border-color);
  display: ${({ isOpen }) => (isOpen ? 'flex' : 'none')};
  flex-direction: column;
  
  @media (max-width: 768px) {
    position: absolute;
    left: 0;
    top: 0;
    bottom: 0;
    z-index: 100;
    width: 80%;
    transform: translateX(${({ isOpen }) => (isOpen ? '0' : '-100%')});
    transition: transform 0.3s ease;
  }
`;

const MainContent = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  background: var(--bg-primary);
  position: relative;
`;

const MessagesContainer = styled.div`
  flex: 1;
  overflow-y: auto;
  padding: 1rem;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  margin-bottom: 70px;

  @media (min-width: 1024px) {
    margin-bottom: 80px;
  }
`;

const InputArea = styled.div`
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  background: var(--bg-secondary);
  padding: 15px;
  display: flex;
  align-items: center;
  gap: 10px;
  border-top: 1px solid var(--border-color);

  @media (min-width: 1024px) {
    position: absolute;
    left: ${({ isSidebarOpen }) => isSidebarOpen ? '350px' : '0'};
    max-width: ${({ isSidebarOpen }) => isSidebarOpen ? 'calc(100% - 350px)' : '100%'};
    padding: 20px;
    transition: left 0.3s ease, max-width 0.3s ease;
  }
`;

const MessageInput = styled.textarea`
  flex: 1;
  padding: 12px;
  border-radius: 20px;
  border: 1px solid var(--border-color);
  background: var(--bg-primary);
  color: var(--text-primary);
  resize: none;
  min-height: 45px;
  max-height: 100px;
  font-size: 15px;

  &:focus {
    outline: none;
    border-color: var(--accent-color);
  }
`;

// Export the styled components to be used in the main component
export {
  ChatContainer,
  Sidebar,
  MainContent,
  MessagesContainer,
  InputArea,
  MessageInput
};

// Keep the default export for the Chat component
export default Chat;
