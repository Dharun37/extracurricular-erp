/**
 * Sidebar Component
 * Simplified sidebar with role switcher for development
 */

import { useState, useEffect } from 'react';
import { FiMenu, FiX, FiUser, FiShield, FiUsers, FiBookOpen } from 'react-icons/fi';

const Sidebar = ({ user, onRoleChange }) => {
  const [isOpen, setIsOpen] = useState(false);

  // Lock body scroll when sidebar is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  // Available roles for development/testing
  const roles = [
    { value: 'admin', label: 'Admin', icon: FiShield },
    { value: 'teacher', label: 'Teacher/Coach', icon: FiUsers },
    { value: 'student', label: 'Student', icon: FiBookOpen }
  ];

  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Hamburger Toggle Button - Only show when closed */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed top-4 left-4 z-50 p-3 bg-blue-600 text-white rounded-lg shadow-lg hover:bg-blue-700 transition-colors"
        >
          <FiMenu className="text-xl" />
        </button>
      )}

      {/* Sidebar */}
      <aside
        className={`fixed top-0 left-0 h-full w-64 bg-white shadow-2xl z-40 transform transition-transform duration-300 ease-in-out ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex flex-col h-full">
          {/* Sidebar Header */}
          <div className="p-6 border-b border-gray-200">
            {/* Close Button */}
            <button
              onClick={() => setIsOpen(false)}
              className="absolute top-4 right-4 p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <FiX className="text-xl" />
            </button>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                <span className="text-white text-xl font-bold">ERP</span>
              </div>
              <div>
                <h2 className="text-sm font-bold text-gray-800">Extra-Curricular</h2>
                <p className="text-xs text-gray-600">Activity Management</p>
              </div>
            </div>
          </div>

          {/* User Info */}
          <div className="p-4 border-b border-gray-200 bg-gradient-to-br from-blue-50 to-purple-50">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center">
                <FiUser className="text-white text-lg" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-semibold text-gray-800">{user.name}</p>
                <p className="text-xs text-gray-600">{user.email}</p>
              </div>
            </div>
            <div className="px-3 py-1.5 bg-blue-100 text-blue-700 rounded-full text-xs font-semibold inline-block">
              {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
            </div>
          </div>

          {/* Dev Role Switcher */}
          <div className="p-4 bg-slate-50 border-b border-slate-200">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-6 h-6 rounded bg-slate-200 flex items-center justify-center">
                <FiUsers className="text-slate-600 text-sm" />
              </div>
              <p className="text-xs font-semibold text-slate-700">Development Mode</p>
            </div>
            <label className="block text-xs font-medium text-gray-600 mb-2">
              Switch Role
            </label>
            <div className="space-y-1">
              {roles.map(role => {
                const IconComponent = role.icon;
                const isActive = user.role === role.value;
                return (
                  <button
                    key={role.value}
                    onClick={() => onRoleChange(role.value)}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                      isActive
                        ? 'bg-blue-600 text-white shadow-sm'
                        : 'text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    <IconComponent className="text-base" />
                    <span>{role.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Info Section */}
          <div className="flex-1 p-4">
            <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
              <h3 className="font-semibold text-gray-900 mb-3 text-sm">Quick Guide</h3>
              <ul className="text-xs text-gray-600 space-y-2">
                <li className="flex items-start gap-2">
                  <FiShield className="text-gray-400 mt-0.5 flex-shrink-0" />
                  <span><strong className="text-gray-700">Admin:</strong> Manage activities & reports</span>
                </li>
                <li className="flex items-start gap-2">
                  <FiUsers className="text-gray-400 mt-0.5 flex-shrink-0" />
                  <span><strong className="text-gray-700">Coach:</strong> Approvals & attendance</span>
                </li>
                <li className="flex items-start gap-2">
                  <FiBookOpen className="text-gray-400 mt-0.5 flex-shrink-0" />
                  <span><strong className="text-gray-700">Student:</strong> Browse & enroll</span>
                </li>
              </ul>
            </div>
          </div>

          {/* Footer */}
          <div className="p-4 border-t border-gray-200 bg-gray-50">
            <p className="text-xs text-center text-gray-600">
              ERP Extra-Curricular v1.0<br/>
              <span className="text-gray-500">© 2026 School System</span>
            </p>
          </div>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
