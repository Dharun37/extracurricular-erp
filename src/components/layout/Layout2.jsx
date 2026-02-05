/**
 * Main Layout Component
 * Simplified layout with just header
 */

import Header from './Header';
import Sidebar from './Sidebar';

const Layout = ({ children, user, onRoleChange }) => {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Sidebar */}
      <Sidebar user={user} onRoleChange={onRoleChange} />

      {/* Main Content Area with padding for sidebar */}
      <div className="transition-all duration-300">
        {/* Top Navigation Bar */}
        <Header user={user} />

        {/* Page Content */}
        <main className="px-4 lg:px-20 py-6">
          {children}
        </main>
      </div>
    </div>
  );
};

export default Layout;
