/**
 * Student Dashboard
 * 
 * Main dashboard for students with activity browsing and enrollment management
 */

import { useState } from 'react';
import ActivityListPage from './ActivityListPage';
import MyActivitiesPage from './MyActivitiesPage';

const StudentDashboard = ({ studentId, studentName }) => {
  const [activeTab, setActiveTab] = useState('browse');

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Dashboard Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Student Dashboard</h1>
        <p className="text-gray-600">Welcome back, {studentName}!</p>
      </div>

      {/* Tab Navigation */}
      <div className="bg-white rounded-xl shadow-sm p-1.5 flex gap-1 mb-6 border border-gray-200">
        <button
          className={`flex-1 px-6 py-3 font-medium rounded-lg transition-all duration-200 ${
            activeTab === 'browse'
              ? 'bg-blue-600 text-white shadow-sm'
              : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
          }`}
          onClick={() => setActiveTab('browse')}
        >
          Browse Activities
        </button>
        <button
          className={`flex-1 px-6 py-3 font-medium rounded-lg transition-all duration-200 ${
            activeTab === 'my-activities'
              ? 'bg-blue-600 text-white shadow-sm'
              : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
          }`}
          onClick={() => setActiveTab('my-activities')}
        >
          My Activities
        </button>
      </div>

      {/* Tab Content */}
      {activeTab === 'browse' && <ActivityListPage studentId={studentId} />}
      {activeTab === 'my-activities' && <MyActivitiesPage studentId={studentId} />}
    </div>
  );
};

export default StudentDashboard;
