/**
 * Admin Dashboard
 * 
 * Main dashboard for administrators with activity management and reporting
 */

import { useState } from 'react';
import ManageActivitiesPage from './ManageActivitiesPage';
import ReportsPage from './ReportsPage';
import UserManagementPage from './UserManagementPage';
import CalendarView from '../common/CalendarView';

const AdminDashboard = () => {
  const [activeTab, setActiveTab] = useState('manage');

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Dashboard Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Admin Dashboard</h1>
        <p className="text-gray-600">Manage extra-curricular activities, users, and view analytics</p>
      </div>

      {/* Tab Navigation */}
      <div className="bg-white rounded-xl shadow-sm p-2 flex flex-wrap gap-2 mb-6">
        <button
          className={`flex-1 min-w-[120px] px-4 py-3 font-semibold rounded-lg transition ${
            activeTab === 'manage'
              ? 'bg-indigo-600 text-white shadow-md'
              : 'text-gray-700 hover:bg-gray-100'
          }`}
          onClick={() => setActiveTab('manage')}
        >
          Manage Activities
        </button>
        <button
          className={`flex-1 min-w-[120px] px-4 py-3 font-semibold rounded-lg transition ${
            activeTab === 'users'
              ? 'bg-indigo-600 text-white shadow-md'
              : 'text-gray-700 hover:bg-gray-100'
          }`}
          onClick={() => setActiveTab('users')}
        >
          User Management
        </button>
        <button
          className={`flex-1 min-w-[120px] px-4 py-3 font-semibold rounded-lg transition ${
            activeTab === 'calendar'
              ? 'bg-indigo-600 text-white shadow-md'
              : 'text-gray-700 hover:bg-gray-100'
          }`}
          onClick={() => setActiveTab('calendar')}
        >
          Calendar
        </button>
        <button
          className={`flex-1 min-w-[120px] px-4 py-3 font-semibold rounded-lg transition ${
            activeTab === 'reports'
              ? 'bg-indigo-600 text-white shadow-md'
              : 'text-gray-700 hover:bg-gray-100'
          }`}
          onClick={() => setActiveTab('reports')}
        >
          Reports
        </button>
      </div>

      {/* Tab Content */}
      {activeTab === 'manage' && <ManageActivitiesPage />}
      {activeTab === 'users' && <UserManagementPage />}
      {activeTab === 'calendar' && <CalendarView />}
      {activeTab === 'reports' && <ReportsPage />}
    </div>
  );
};

export default AdminDashboard;
