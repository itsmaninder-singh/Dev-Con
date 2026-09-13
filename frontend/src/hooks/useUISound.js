import { useEffect, useState, useCallback } from 'react';
import soundManager from '../utils/soundManager.js';

export function useUISound() {
  const [state, setState] = useState({
    enabled: soundManager.isEnabled(),
    volume: soundManager.getVolume(),
  });

  useEffect(() => {
    return soundManager.subscribe((next) => {
      setState({ enabled: next.enabled, volume: next.volume });
    });
  }, []);

  const playClick = useCallback((options) => {
    soundManager.playClick(options);
  }, []);

  const playToggle = useCallback((active) => {
    soundManager.playToggle(active);
  }, []);

  const playModalOpen = useCallback(() => {
    soundManager.playModalOpen();
  }, []);

  const playModalClose = useCallback(() => {
    soundManager.playModalClose();
  }, []);

  const playPageFlip = useCallback(() => {
    soundManager.playPageFlip();
  }, []);

  const toggleSound = useCallback(() => {
    soundManager.setEnabled(!soundManager.isEnabled());
  }, []);

  const setVolume = useCallback((val) => {
    soundManager.setVolume(val);
  }, []);

  return {
    soundEnabled: state.enabled,
    volume: state.volume,
    playClick,
    playToggle,
    playModalOpen,
    playModalClose,
    playPageFlip,
    toggleSound,
    setVolume,
  };
}

export default useUISound;
