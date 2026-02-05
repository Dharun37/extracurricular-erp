/**
 * Main Layout Component
 * Wraps the application with Sidebar and provides navigation context
 */

import { useState, useEffect, useRef } from 'react';
import Sidebar from './Sidebar';
import { FiBell, FiUser, FiCalendar, FiHome, FiX, FiCheck, FiClock, FiAlertCircle } from 'react-icons/fi';

const Layout = ({ user, onRoleChange, onCoachChange, availableCoaches, onStudentChange, availableStudents, onNavigate, currentView, children }) => {
  const [notifications, setNotifications] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const notificationRef = useRef(null);

  // Generate sample notifications based on role
  useEffect(() => {
    const generateNotifications = () => {
      const now = new Date();
      const baseNotifications = [];

      if (user.role === 'student') {
        baseNotifications.push(
          { id: 1, type: 'success', title: 'Enrollment Approved', message: 'Your enrollment in Football Training has been approved!', time: new Date(now - 1000 * 60 * 30), read: false },
          { id: 2, type: 'info', title: 'New Activity Available', message: 'Photography Club is now accepting new students.', time: new Date(now - 1000 * 60 * 60 * 2), read: false },
          { id: 3, type: 'warning', title: 'Schedule Change', message: 'Basketball Club timing changed to 5-6:30 PM.', time: new Date(now - 1000 * 60 * 60 * 24), read: true }
        );
      } else if (user.role === 'teacher') {
        baseNotifications.push(
          { id: 1, type: 'info', title: 'New Enrollment Request', message: 'A student has requested to join your activity.', time: new Date(now - 1000 * 60 * 15), read: false },
          { id: 2, type: 'success', title: 'Attendance Saved', message: 'Attendance for today has been recorded.', time: new Date(now - 1000 * 60 * 60), read: false },
          { id: 3, type: 'info', title: 'Performance Review', message: 'Monthly performance reports are due this week.', time: new Date(now - 1000 * 60 * 60 * 5), read: true }
        );
      } else if (user.role === 'admin') {
        baseNotifications.push(
          { id: 1, type: 'info', title: 'New Activity Created', message: 'Science Experiments has been added to the system.', time: new Date(now - 1000 * 60 * 45), read: false },
          { id: 2, type: 'warning', title: 'Capacity Alert', message: 'Football Training is at 90% capacity.', time: new Date(now - 1000 * 60 * 60 * 3), read: false },
          { id: 3, type: 'success', title: 'Report Generated', message: 'Monthly participation report is ready.', time: new Date(now - 1000 * 60 * 60 * 24), read: true }
        );
      }

      setNotifications(baseNotifications);
    };

    generateNotifications();
  }, [user.role]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (notificationRef.current && !notificationRef.current.contains(event.target)) {
        setShowNotifications(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const unreadCount = notifications.filter(n => !n.read).length;

  const markAsRead = (id) => {
    setNotifications(prev => 
      prev.map(n => n.id === id ? { ...n, read: true } : n)
    );
  };

  const markAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  const clearNotification = (id) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  const formatTime = (date) => {
    const now = new Date();
    const diff = now - date;
    const minutes = Math.floor(diff / (1000 * 60));
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return `${days}d ago`;
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'success': return <FiCheck className="text-green-500" />;
      case 'warning': return <FiAlertCircle className="text-yellow-500" />;
      default: return <FiClock className="text-blue-500" />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Sidebar */}
      <Sidebar user={user} onRoleChange={onRoleChange} />

      {/* Main Content Area */}
      <div className="transition-all duration-300">
        {/* Top Navigation Bar */}
        <header className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-30">
          <div className="px-4 lg:px-20 py-4 flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-800">
                {currentView === 'profile' && 'My Profile'}
                {currentView === 'calendar' && 'Calendar'}
                {currentView === 'dashboard' && (
                  <>
                    {user.role === 'admin' && 'Admin Dashboard'}
                    {user.role === 'teacher' && 'Coach Dashboard'}
                    {user.role === 'student' && 'Student Dashboard'}
                  </>
                )}
              </h1>
              <p className="text-sm text-gray-600 mt-1">
                Welcome, {user.name} - {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
              </p>
            </div>

            <div className="flex items-center gap-2">
              {/* Navigation Buttons */}
              <button
                onClick={() => onNavigate && onNavigate('dashboard')}
                className={`p-2 rounded-lg transition-colors ${
                  currentView === 'dashboard' 
                    ? 'bg-blue-100 text-blue-600' 
                    : 'text-gray-600 hover:text-gray-800 hover:bg-gray-100'
                }`}
                title="Dashboard"
              >
                <FiHome className="text-xl" />
              </button>

              <button
                onClick={() => onNavigate && onNavigate('calendar')}
                className={`p-2 rounded-lg transition-colors ${
                  currentView === 'calendar' 
                    ? 'bg-blue-100 text-blue-600' 
                    : 'text-gray-600 hover:text-gray-800 hover:bg-gray-100'
                }`}
                title="Calendar"
              >
                <FiCalendar className="text-xl" />
              </button>

              <button
                onClick={() => onNavigate && onNavigate('profile')}
                className={`p-2 rounded-lg transition-colors ${
                  currentView === 'profile' 
                    ? 'bg-blue-100 text-blue-600' 
                    : 'text-gray-600 hover:text-gray-800 hover:bg-gray-100'
                }`}
                title="Profile"
              >
                <FiUser className="text-xl" />
              </button>

              {/* Coach Selector - Only show for teacher role */}
              {user.role === 'teacher' && onCoachChange && availableCoaches && (
                <div className="flex items-center gap-2 ml-2 pl-2 border-l border-gray-200">
                  <select
                    value={user.id}
                    onChange={(e) => onCoachChange(e.target.value)}
                    className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
                  >
                    {availableCoaches.map(coach => (
                      <option key={coach.id} value={coach.id}>
                        {coach.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Student Selector - Only show for student role */}
              {user.role === 'student' && onStudentChange && availableStudents && (
                <div className="flex items-center gap-2 ml-2 pl-2 border-l border-gray-200">
                  <select
                    value={user.id}
                    onChange={(e) => onStudentChange(e.target.value)}
                    className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
                  >
                    {availableStudents.map(student => (
                      <option key={student.id} value={student.id}>
                        {student.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Notifications */}
              <div className="relative ml-2" ref={notificationRef}>
                <button 
                  onClick={() => setShowNotifications(!showNotifications)}
                  className={`relative p-2 rounded-lg transition-colors ${
                    showNotifications 
                      ? 'bg-blue-100 text-blue-600' 
                      : 'text-gray-600 hover:text-gray-800 hover:bg-gray-100'
                  }`}
                >
                  <FiBell className="text-xl" />
                  {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                      {unreadCount}
                    </span>
                  )}
                </button>

                {/* Notification Dropdown */}
                {showNotifications && (
                  <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-xl border border-gray-200 z-50 overflow-hidden">
                    {/* Header */}
                    <div className="px-4 py-3 bg-gray-50 border-b border-gray-200 flex items-center justify-between">
                      <h3 className="font-semibold text-gray-900">Notifications</h3>
                      {unreadCount > 0 && (
                        <button 
                          onClick={markAllAsRead}
                          className="text-xs text-blue-600 hover:text-blue-800 font-medium"
                        >
                          Mark all as read
                        </button>
                      )}
                    </div>

                    {/* Notification List */}
                    <div className="max-h-80 overflow-y-auto">
                      {notifications.length === 0 ? (
                        <div className="px-4 py-8 text-center text-gray-500">
                          <FiBell className="text-3xl mx-auto mb-2 text-gray-300" />
                          <p className="text-sm">No notifications</p>
                        </div>
                      ) : (
                        notifications.map(notification => (
                          <div 
                            key={notification.id}
                            className={`px-4 py-3 border-b border-gray-100 hover:bg-gray-50 transition-colors ${
                              !notification.read ? 'bg-blue-50/50' : ''
                            }`}
                          >
                            <div className="flex items-start gap-3">
                              <div className="mt-0.5">
                                {getNotificationIcon(notification.type)}
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-start justify-between gap-2">
                                  <p className={`text-sm font-medium ${!notification.read ? 'text-gray-900' : 'text-gray-700'}`}>
                                    {notification.title}
                                  </p>
                                  <button 
                                    onClick={() => clearNotification(notification.id)}
                                    className="text-gray-400 hover:text-gray-600 flex-shrink-0"
                                  >
                                    <FiX className="text-sm" />
                                  </button>
                                </div>
                                <p className="text-xs text-gray-600 mt-0.5 line-clamp-2">
                                  {notification.message}
                                </p>
                                <div className="flex items-center gap-2 mt-1">
                                  <span className="text-xs text-gray-400">
                                    {formatTime(notification.time)}
                                  </span>
                                  {!notification.read && (
                                    <button 
                                      onClick={() => markAsRead(notification.id)}
                                      className="text-xs text-blue-600 hover:text-blue-800"
                                    >
                                      Mark as read
                                    </button>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                        ))
                      )}
                    </div>

                    {/* Footer */}
                    {notifications.length > 0 && (
                      <div className="px-4 py-2 bg-gray-50 border-t border-gray-200">
                        <button 
                          onClick={() => setNotifications([])}
                          className="w-full text-center text-xs text-gray-600 hover:text-gray-800 font-medium py-1"
                        >
                          Clear all notifications
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="p-4 lg:p-8">
          {children}
        </main>

        {/* Footer */}
        <footer className="bg-white border-t border-gray-200 py-6 px-4 lg:px-20 mt-12">
          <div className="text-center text-sm text-gray-600">
            <p>2026 Extra-Curricular Activity Management System</p>
            <p className="mt-1 text-xs text-gray-500">Development Mode - Role switching enabled in sidebar</p>
          </div>
        </footer>
      </div>
    </div>
  );
};

export default Layout;