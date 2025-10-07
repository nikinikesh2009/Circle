import { useCallback, useRef, useState } from 'react';

interface LongPressOptions {
  onLongPress: (event: React.MouseEvent | React.TouchEvent) => void;
  onClick?: (event: React.MouseEvent | React.TouchEvent) => void;
  delay?: number;
  moveThreshold?: number;
  enableHaptic?: boolean;
}

interface LongPressHandlers {
  onMouseDown: (e: React.MouseEvent) => void;
  onMouseUp: (e: React.MouseEvent) => void;
  onMouseLeave: (e: React.MouseEvent) => void;
  onTouchStart: (e: React.TouchEvent) => void;
  onTouchEnd: (e: React.TouchEvent) => void;
  onTouchMove: (e: React.TouchEvent) => void;
}

export function useLongPress({
  onLongPress,
  onClick,
  delay = 500,
  moveThreshold = 10,
  enableHaptic = true,
}: LongPressOptions): LongPressHandlers {
  const [longPressTriggered, setLongPressTriggered] = useState(false);
  const timeout = useRef<NodeJS.Timeout>();
  const target = useRef<EventTarget>();
  const startPos = useRef<{ x: number; y: number }>();

  const triggerHaptic = useCallback(() => {
    if (enableHaptic && 'vibrate' in navigator) {
      navigator.vibrate(50); // Short vibration feedback
    }
  }, [enableHaptic]);

  const start = useCallback(
    (event: React.MouseEvent | React.TouchEvent) => {
      // Prevent text selection on long press
      event.preventDefault();
      
      // Store initial position
      if ('touches' in event) {
        startPos.current = {
          x: event.touches[0].clientX,
          y: event.touches[0].clientY,
        };
      } else {
        startPos.current = {
          x: event.clientX,
          y: event.clientY,
        };
      }

      target.current = event.target;
      setLongPressTriggered(false);

      timeout.current = setTimeout(() => {
        triggerHaptic();
        onLongPress(event);
        setLongPressTriggered(true);
      }, delay);
    },
    [onLongPress, delay, triggerHaptic]
  );

  const clear = useCallback(
    (event: React.MouseEvent | React.TouchEvent, shouldTriggerClick = true) => {
      timeout.current && clearTimeout(timeout.current);
      
      if (shouldTriggerClick && !longPressTriggered && onClick) {
        onClick(event);
      }
      
      setLongPressTriggered(false);
      startPos.current = undefined;
    },
    [onClick, longPressTriggered]
  );

  const checkMove = useCallback(
    (currentX: number, currentY: number) => {
      if (!startPos.current) return false;

      const deltaX = Math.abs(currentX - startPos.current.x);
      const deltaY = Math.abs(currentY - startPos.current.y);

      // If moved too much, cancel long press
      if (deltaX > moveThreshold || deltaY > moveThreshold) {
        timeout.current && clearTimeout(timeout.current);
        return true;
      }
      return false;
    },
    [moveThreshold]
  );

  return {
    onMouseDown: (e: React.MouseEvent) => start(e),
    onMouseUp: (e: React.MouseEvent) => clear(e),
    onMouseLeave: (e: React.MouseEvent) => clear(e, false),
    onTouchStart: (e: React.TouchEvent) => start(e),
    onTouchEnd: (e: React.TouchEvent) => clear(e),
    onTouchMove: (e: React.TouchEvent) => {
      if (e.touches.length > 0) {
        checkMove(e.touches[0].clientX, e.touches[0].clientY);
      }
    },
  };
}
