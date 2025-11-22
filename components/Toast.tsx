import React from 'react';
import { useToast } from './ToastContext';

const Toast: React.FC = () => {
  const { toasts, removeToast } = useToast();

  const bgColor = {
    success: 'bg-green-500/90',
    error: 'bg-red-500/90',
    info: 'bg-blue-500/90',
    warning: 'bg-yellow-500/90',
  };

  const icons = {
    success: '✓',
    error: '✕',
    info: 'ℹ',
    warning: '⚠',
  };

  return (
    <div className="fixed top-4 right-4 z-[9999] space-y-2 pointer-events-none">
      {toasts.map(toast => (
        <div
          key={toast.id}
          className={`${bgColor[toast.type]} text-white px-4 py-3 rounded-lg shadow-lg flex items-center gap-3 animate-slide-up-fade-in pointer-events-auto`}
        >
          <span className="text-lg font-bold">{icons[toast.type]}</span>
          <span className="font-medium">{toast.message}</span>
          <button
            onClick={() => removeToast(toast.id)}
            className="ml-2 text-white/80 hover:text-white transition"
          >
            ✕
          </button>
        </div>
      ))}
    </div>
  );
};

export default Toast;
