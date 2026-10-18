import { useState, useCallback, useRef } from 'react';

/**
 * useShareModal
 * Manages modal visibility, active card metadata, and trigger focus restoration.
 */
export function useShareModal() {
  const [isOpen, setIsOpen] = useState(false);
  const [cardData, setCardData] = useState(null);
  const triggerRef = useRef(null);

  const openShare = useCallback((data, triggerElement = null) => {
    if (triggerElement) {
      triggerRef.current = triggerElement.current || triggerElement;
    }
    setCardData(data);
    setIsOpen(true);
  }, []);

  const closeShare = useCallback(() => {
    setIsOpen(false);
  }, []);

  return {
    isOpen,
    cardData,
    triggerRef,
    openShare,
    closeShare
  };
}

export default useShareModal;
