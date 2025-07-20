import React, { useCallback, useRef, useState, useEffect } from 'react';

interface VirtualJoystickProps {
  onMove: (x: number, y: number) => void;
  onStop: () => void;
}

const VirtualJoystick: React.FC<VirtualJoystickProps> = ({ onMove, onStop }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [knobPosition, setKnobPosition] = useState({ x: 50, y: 50 });
  const [containerCenter, setContainerCenter] = useState({ x: 0, y: 0 });

  const joystickSize = 120;
  const knobSize = 40;
  const maxDistance = (joystickSize - knobSize) / 2;

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const rect = container.getBoundingClientRect();
    setContainerCenter({
      x: rect.left + rect.width / 2,
      y: rect.top + rect.height / 2
    });
  }, []);

  const handleStart = useCallback((clientX: number, clientY: number) => {
    setIsDragging(true);
    updateKnobPosition(clientX, clientY);
  }, []);

  const handleMove = useCallback((clientX: number, clientY: number) => {
    if (!isDragging) return;
    updateKnobPosition(clientX, clientY);
  }, [isDragging]);

  const handleEnd = useCallback(() => {
    setIsDragging(false);
    setKnobPosition({ x: 50, y: 50 });
    onStop();
  }, [onStop]);

  const updateKnobPosition = (clientX: number, clientY: number) => {
    const container = containerRef.current;
    if (!container) return;

    const rect = container.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;

    const deltaX = clientX - centerX;
    const deltaY = clientY - centerY;
    const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);

    let finalX = deltaX;
    let finalY = deltaY;

    if (distance > maxDistance) {
      finalX = (deltaX / distance) * maxDistance;
      finalY = (deltaY / distance) * maxDistance;
    }

    const percentX = 50 + (finalX / maxDistance) * 50;
    const percentY = 50 + (finalY / maxDistance) * 50;

    setKnobPosition({ x: percentX, y: percentY });

    const normalizedX = finalX / maxDistance;
    const normalizedY = finalY / maxDistance;
    onMove(normalizedX, normalizedY);
  };

  // Touch events
  const handleTouchStart = (e: React.TouchEvent) => {
    e.preventDefault();
    const touch = e.touches[0];
    handleStart(touch.clientX, touch.clientY);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    e.preventDefault();
    const touch = e.touches[0];
    handleMove(touch.clientX, touch.clientY);
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    e.preventDefault();
    handleEnd();
  };

  // Mouse events (for testing on desktop)
  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    handleStart(e.clientX, e.clientY);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    e.preventDefault();
    handleMove(e.clientX, e.clientY);
  };

  const handleMouseUp = (e: React.MouseEvent) => {
    e.preventDefault();
    handleEnd();
  };

  useEffect(() => {
    const handleGlobalMouseMove = (e: MouseEvent) => {
      if (isDragging) {
        handleMove(e.clientX, e.clientY);
      }
    };

    const handleGlobalMouseUp = () => {
      if (isDragging) {
        handleEnd();
      }
    };

    const handleGlobalTouchMove = (e: TouchEvent) => {
      if (isDragging && e.touches.length > 0) {
        e.preventDefault();
        const touch = e.touches[0];
        handleMove(touch.clientX, touch.clientY);
      }
    };

    const handleGlobalTouchEnd = () => {
      if (isDragging) {
        handleEnd();
      }
    };

    if (isDragging) {
      document.addEventListener('mousemove', handleGlobalMouseMove);
      document.addEventListener('mouseup', handleGlobalMouseUp);
      document.addEventListener('touchmove', handleGlobalTouchMove, { passive: false });
      document.addEventListener('touchend', handleGlobalTouchEnd);
    }

    return () => {
      document.removeEventListener('mousemove', handleGlobalMouseMove);
      document.removeEventListener('mouseup', handleGlobalMouseUp);
      document.removeEventListener('touchmove', handleGlobalTouchMove);
      document.removeEventListener('touchend', handleGlobalTouchEnd);
    };
  }, [isDragging, handleMove, handleEnd]);

  return (
    <div className="fixed bottom-6 left-6 z-50 md:hidden">
      <div
        ref={containerRef}
        className="relative"
        style={{
          width: joystickSize,
          height: joystickSize,
        }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
      >
        {/* Joystick Base */}
        <div
          className="absolute inset-0 rounded-full border-4 border-white/30 bg-black/20 backdrop-blur-sm"
          style={{
            width: joystickSize,
            height: joystickSize,
          }}
        />
        
        {/* Center Dot */}
        <div className="absolute top-1/2 left-1/2 w-2 h-2 bg-white/50 rounded-full transform -translate-x-1/2 -translate-y-1/2" />
        
        {/* Joystick Knob */}
        <div
          className="absolute rounded-full bg-gradient-to-br from-blue-400 to-purple-600 border-3 border-white/50 shadow-lg transition-transform duration-75"
          style={{
            width: knobSize,
            height: knobSize,
            left: `${knobPosition.x}%`,
            top: `${knobPosition.y}%`,
            transform: 'translate(-50%, -50%)',
            boxShadow: isDragging 
              ? '0 0 20px rgba(59, 130, 246, 0.8), 0 0 40px rgba(147, 51, 234, 0.6)' 
              : '0 4px 12px rgba(0, 0, 0, 0.5)',
          }}
        >
          <div className="w-full h-full rounded-full bg-gradient-to-br from-white/20 to-transparent" />
        </div>
      </div>
    </div>
  );
};

export default VirtualJoystick;