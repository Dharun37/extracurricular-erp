/**
 * Toast Notification Component
 * 
 * Displays temporary notification messages
 * Types: success, error, warning, info
 */

import { useEffect } from 'react';
import { FiCheckCircle, FiXCircle, FiAlertCircle, FiInfo, FiX } from 'react-icons/fi';

const Toast = ({ message, type = 'info', onClose, duration = 3000 }) => {
  useEffect(() => {
    if (duration > 0) {
      const timer = setTimeout(() => {
        onClose();
      }, duration);
      return () => clearTimeout(timer);
    }
  }, [duration, onClose]);

  const styles = {
    success: {
      bg: 'bg-green-50 border-green-200',
      icon: 'text-green-600',
      text: 'text-green-800',
      IconComponent: FiCheckCircle
    },
    error: {
      bg: 'bg-red-50 border-red-200',
      icon: 'text-red-600',
      text: 'text-red-800',
      IconComponent: FiXCircle
    },
    warning: {
      bg: 'bg-yellow-50 border-yellow-200',
      icon: 'text-yellow-600',
      text: 'text-yellow-800',
      IconComponent: FiAlertCircle
    },
    info: {
      bg: 'bg-blue-50 border-blue-200',
      icon: 'text-blue-600',
      text: 'text-blue-800',
      IconComponent: FiInfo
    }
  };

  const style = styles[type] || styles.info;
  const IconComponent = style.IconComponent;

  return (
    <div
      className={`${style.bg} border rounded-lg shadow-lg p-4 flex items-start gap-3 min-w-[300px] max-w-md animate-slide-in`}
    >
      <IconComponent className={`${style.icon} flex-shrink-0 mt-0.5`} size={20} />
      <p className={`${style.text} flex-1 text-sm font-medium`}>{message}</p>
      <button
        onClick={onClose}
        className={`${style.icon} hover:opacity-70 transition-opacity flex-shrink-0`}
      >
        <FiX size={18} />
      </button>
    </div>
  );
};

export default Toast;
