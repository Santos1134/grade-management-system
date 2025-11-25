import { useEffect } from 'react';

interface NotificationProps {
  message: string;
  type: 'success' | 'error' | 'info';
  onClose: () => void;
  duration?: number;
}

export default function Notification({ message, type, onClose, duration = 4000 }: NotificationProps) {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, duration);

    return () => clearTimeout(timer);
  }, [duration, onClose]);

  const styles = {
    success: {
      bg: 'bg-gradient-to-r from-green-500 to-green-600',
      border: 'border-green-300',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      )
    },
    error: {
      bg: 'bg-gradient-to-r from-red-500 to-red-600',
      border: 'border-red-300',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      )
    },
    info: {
      bg: 'bg-gradient-to-r from-blue-500 to-blue-600',
      border: 'border-blue-300',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      )
    }
  };

  const style = styles[type];

  return (
    <div className="fixed top-4 right-4 left-4 sm:left-auto z-50 animate-slide-down">
      <div className={`${style.bg} border-2 ${style.border} text-white px-4 py-4 sm:px-6 rounded-xl shadow-2xl flex items-start gap-3 max-w-md mx-auto sm:mx-0 backdrop-blur-sm`}>
        <div className="flex-shrink-0 mt-0.5">
          {style.icon}
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-sm sm:text-base leading-relaxed break-words">{message}</p>
        </div>
        <button
          onClick={onClose}
          className="flex-shrink-0 text-white hover:text-gray-200 transition-colors p-1 rounded-lg hover:bg-white/20"
          aria-label="Close notification"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>
  );
}
