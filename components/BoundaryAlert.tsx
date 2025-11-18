import React, { useState, useEffect } from 'react';

interface BoundaryAlertProps {
  boundaryType: 4 | 6 | null;
  key: number; // To re-trigger animation on same boundary type
}

const BoundaryAlert: React.FC<BoundaryAlertProps> = ({ boundaryType }) => {
  const [visible, setVisible] = useState(false);
  const [text, setText] = useState('');

  useEffect(() => {
    if (boundaryType) {
      setText(boundaryType === 4 ? "FOUR!" : "SIX!");
      setVisible(true);
      
      const timer = setTimeout(() => {
        setVisible(false);
      }, 2000); // Animation duration

      return () => clearTimeout(timer);
    }
  }, [boundaryType, status]);

  if (!visible) {
    return null;
  }

  const gradient = boundaryType === 4 
    ? "from-blue-500 to-cyan-400" 
    : "from-purple-600 to-indigo-500";

  return (
    <div className="fixed inset-0 flex items-center justify-center pointer-events-none z-[100]">
      <div 
        className={`text-7xl md:text-9xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r ${gradient} drop-shadow-lg boundary-alert-enter`}
      >
        {text}
      </div>
    </div>
  );
};

export default BoundaryAlert;