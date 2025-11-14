import React, { useState, useEffect } from 'react';

interface BoundaryAlertProps {
  boundaryType: 4 | 6 | null;
}

const BoundaryAlert: React.FC<BoundaryAlertProps> = ({ boundaryType }) => {
  const [visible, setVisible] = useState(false);
  const [animationClass, setAnimationClass] = useState('');
  const [currentBoundary, setCurrentBoundary] = useState<4 | 6 | null>(null);

  useEffect(() => {
    if (boundaryType) {
      setCurrentBoundary(boundaryType);
      setVisible(true);
      setAnimationClass('boundary-alert-enter');
      
      const timer = setTimeout(() => {
        setAnimationClass('boundary-alert-exit');
        setTimeout(() => {
            setVisible(false);
            setCurrentBoundary(null);
        }, 500); // Wait for exit animation to finish
      }, 1500); // Alert stays on screen for 1.5 seconds

      return () => clearTimeout(timer);
    }
  }, [boundaryType]);

  if (!visible || !currentBoundary) {
    return null;
  }

  const text = currentBoundary === 4 ? "FOUR!" : "SIX!";
  const gradient = currentBoundary === 4 
    ? "from-blue-500 to-cyan-400" 
    : "from-purple-600 to-indigo-500";

  return (
    <div className="fixed inset-0 flex items-center justify-center pointer-events-none z-[100]">
      <div 
        key={Date.now()} // Force re-render for animation
        className={`text-7xl md:text-9xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r ${gradient} drop-shadow-lg ${animationClass}`}
      >
        {text}
      </div>
    </div>
  );
};

export default BoundaryAlert;
