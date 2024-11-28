import { useEffect, useRef, useState } from 'react';
import styled from 'styled-components';

const VideoCall = ({ roomName, onClose, username }) => {
  const jitsiContainerRef = useRef(null);
  const jitsiApiRef = useRef(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadJitsiScript = () => {
      if (window.JitsiMeetExternalAPI) {
        initJitsi();
        return;
      }

      const script = document.createElement('script');
      script.src = 'https://meet.jit.si/external_api.js';
      script.async = true;
      script.onload = initJitsi;
      document.body.appendChild(script);
    };

    const initJitsi = () => {
      const domain = 'meet.jit.si';
      const options = {
        roomName: roomName,
        width: '100%',
        height: '100%',
        parentNode: jitsiContainerRef.current,
        userInfo: {
          displayName: username
        },
        configOverwrite: {
          prejoinPageEnabled: false,
          startWithAudioMuted: false,
          startWithVideoMuted: false
        },
        interfaceConfigOverwrite: {
          TOOLBAR_BUTTONS: [
            'microphone', 'camera', 'closedcaptions', 'desktop', 
            'fullscreen', 'fodeviceselection', 'hangup', 'chat',
            'recording', 'livestreaming', 'etherpad', 'sharedvideo',
            'settings', 'raisehand', 'videoquality', 'filmstrip',
            'feedback', 'stats', 'shortcuts', 'tileview', 'select-background',
            'download', 'help', 'mute-everyone', 'security'
          ]
        }
      };

      jitsiApiRef.current = new window.JitsiMeetExternalAPI(domain, options);

      const handleError = (error) => {
        console.error('Jitsi error:', error);
        alert('Failed to initialize call. Please try again.');
        onClose();
      };

      jitsiApiRef.current.addEventListeners({
        readyToClose: onClose,
        participantLeft: onClose,
        videoConferenceLeft: onClose,
        error: handleError
      });

      jitsiApiRef.current.addEventListener('videoConferenceJoined', () => {
        setIsLoading(false);
      });
    };

    loadJitsiScript();

    return () => {
      if (jitsiApiRef.current) {
        jitsiApiRef.current.dispose();
      }
    };
  }, [roomName, onClose, username]);

  return (
    <VideoCallContainer>
      {isLoading && <LoadingOverlay>Connecting to call...</LoadingOverlay>}
      <div ref={jitsiContainerRef} style={{ width: '100%', height: '100%' }} />
    </VideoCallContainer>
  );
};

const VideoCallContainer = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: #000;
  z-index: 1000;
`;

const LoadingOverlay = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.8);
  color: var(--text-primary);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.2rem;
  z-index: 1001;
`;

export default VideoCall; 