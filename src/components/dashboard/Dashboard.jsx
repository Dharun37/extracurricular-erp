/**
 * Dashboard Component
 * Main landing page with statistics and quick actions
 */

import { FiActivity, FiUsers, FiCalendar, FiTrendingUp, FiAward } from 'react-icons/fi';

const Dashboard = ({ user }) => {
  // Mock data - replace with actual API calls
  const stats = [
    {
      label: 'Active Activities',
      value: '12',
      icon: FiActivity,
      color: 'bg-blue-500',
      trend: '+3 this month'
    },
    {
      label: 'Enrolled Students',
      value: '248',
      icon: FiUsers,
      color: 'bg-green-500',
      trend: '+12% from last month'
    },
    {
      label: 'Upcoming Events',
      value: '8',
      icon: FiCalendar,
      color: 'bg-purple-500',
      trend: 'Next event in 2 days'
    },
    {
      label: 'Achievements',
      value: '24',
      icon: FiAward,
      color: 'bg-yellow-500',
      trend: '+5 new awards'
    }
  ];

  const recentActivities = [
    { name: 'Basketball Practice', time: '2 hours ago', status: 'ongoing' },
    { name: 'Music Class', time: '4 hours ago', status: 'completed' },
    { name: 'Drama Workshop', time: 'Tomorrow at 2 PM', status: 'upcoming' },
    { name: 'Art Competition', time: 'In 3 days', status: 'upcoming' }
  ];

  const quickActions = [
    { label: 'Create Activity', icon: '➕', action: 'create-activity' },
    { label: 'View Enrollments', icon: '📋', action: 'enrollments' },
    { label: 'Mark Attendance', icon: '✓', action: 'attendance' },
    { label: 'Generate Report', icon: '📊', action: 'reports' }
  ];

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-700 rounded-xl p-8 text-white shadow-lg">
        <h2 className="text-3xl font-bold mb-2">
          Welcome back, {user.name}! 👋
        </h2>
        <p className="text-blue-100 text-lg">
          {user.role === 'admin' && "Here's an overview of your extra-curricular activities management."}
          {user.role === 'teacher' && "Manage your classes and track student progress."}
          {user.role === 'student' && "Explore activities and track your enrollments."}
          {user.role === 'parent' && "Monitor your child's extra-curricular participation."}
        </p>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => (
          <div key={index} className="bg-white rounded-xl shadow-md p-6 hover:shadow-lg transition-shadow">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-gray-600 text-sm font-medium mb-2">{stat.label}</p>
                <p className="text-3xl font-bold text-gray-800">{stat.value}</p>
                <p className="text-xs text-gray-500 mt-2">{stat.trend}</p>
              </div>
              <div className={`${stat.color} p-3 rounded-lg`}>
                <stat.icon className="text-white text-2xl" />
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Activities */}
        <div className="lg:col-span-2 bg-white rounded-xl shadow-md p-6">
          <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
            <FiTrendingUp className="text-blue-600" />
            Recent Activities
          </h3>
          <div className="space-y-3">
            {recentActivities.map((activity, index) => (
              <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                <div className="flex items-center gap-3">
                  <div className={`w-3 h-3 rounded-full ${
                    activity.status === 'ongoing' ? 'bg-green-500' :
                    activity.status === 'completed' ? 'bg-gray-400' :
                    'bg-blue-500'
                  }`} />
                  <div>
                    <p className="font-semibold text-gray-800">{activity.name}</p>
                    <p className="text-sm text-gray-500">{activity.time}</p>
                  </div>
                </div>
                <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                  activity.status === 'ongoing' ? 'bg-green-100 text-green-700' :
                  activity.status === 'completed' ? 'bg-gray-100 text-gray-700' :
                  'bg-blue-100 text-blue-700'
                }`}>
                  {activity.status}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-xl shadow-md p-6">
          <h3 className="text-xl font-bold text-gray-800 mb-4">Quick Actions</h3>
          <div className="space-y-3">
            {quickActions.map((action, index) => (
              <button
                key={index}
                className="w-full flex items-center gap-3 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 hover:from-blue-100 hover:to-indigo-100 rounded-lg transition-colors text-left"
              >
                <span className="text-2xl">{action.icon}</span>
                <span className="font-medium text-gray-700">{action.label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Calendar Preview / Upcoming Events */}
      <div className="bg-white rounded-xl shadow-md p-6">
        <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
          <FiCalendar className="text-blue-600" />
          This Week's Schedule
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-7 gap-2">
          {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day, index) => (
            <div key={index} className="bg-gray-50 rounded-lg p-4 text-center hover:bg-blue-50 transition-colors cursor-pointer">
              <p className="text-xs text-gray-500 mb-1">{day}</p>
              <p className="text-xl font-bold text-gray-800">{27 + index}</p>
              <div className="mt-2">
                {index === 1 && <div className="w-2 h-2 bg-blue-500 rounded-full mx-auto" />}
                {index === 3 && <div className="w-2 h-2 bg-green-500 rounded-full mx-auto" />}
                {index === 5 && <div className="w-2 h-2 bg-purple-500 rounded-full mx-auto" />}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
