/**
 * Reports Component
 * 
 * System-wide reports and analytics for admin
 * Displays activity statistics, enrollment data, and insights
 */

import { useState, useEffect } from 'react';
import { getAllActivities, getAllEnrollments } from '../../services/api';

const Reports = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [stats, setStats] = useState({
    totalActivities: 0,
    totalEnrollments: 0,
    totalCapacity: 0,
    utilizationRate: 0,
    activitiesByCategory: {},
    topActivities: [],
    categoryStats: []
  });

  useEffect(() => {
    fetchReportData();
  }, []);

  const fetchReportData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch activities and enrollments
      const [activitiesRes, enrollmentsRes] = await Promise.all([
        getAllActivities(),
        getAllEnrollments()
      ]);

      const activities = activitiesRes.data || [];
      const enrollments = enrollmentsRes.data || [];

      // Calculate statistics
      const totalActivities = activities.length;
      const totalEnrollments = enrollments.filter(e => e.status === 'active').length;
      const totalCapacity = activities.reduce((sum, act) => sum + parseInt(act.max_students || 0), 0);
      const utilizationRate = totalCapacity > 0 ? ((totalEnrollments / totalCapacity) * 100).toFixed(1) : 0;

      // Activities by category
      const activitiesByCategory = {};
      const enrollmentsByActivity = {};
      
      activities.forEach(activity => {
        const cat = activity.category || 'other';
        activitiesByCategory[cat] = (activitiesByCategory[cat] || 0) + 1;
        enrollmentsByActivity[activity.id] = {
          name: activity.name,
          category: activity.category,
          enrollments: 0,
          maxStudents: activity.max_students
        };
      });

      // Count enrollments per activity
      enrollments.forEach(enrollment => {
        if (enrollment.status === 'active' && enrollmentsByActivity[enrollment.activity_id]) {
          enrollmentsByActivity[enrollment.activity_id].enrollments++;
        }
      });

      // Get top activities by enrollment
      const topActivities = Object.values(enrollmentsByActivity)
        .sort((a, b) => b.enrollments - a.enrollments)
        .slice(0, 5);

      // Category statistics
      const categoryStats = Object.entries(activitiesByCategory).map(([category, count]) => {
        const categoryEnrollments = Object.values(enrollmentsByActivity)
          .filter(a => a.category === category)
          .reduce((sum, a) => sum + a.enrollments, 0);
        
        const categoryCapacity = activities
          .filter(a => a.category === category)
          .reduce((sum, a) => sum + parseInt(a.max_students || 0), 0);

        return {
          category,
          activities: count,
          enrollments: categoryEnrollments,
          capacity: categoryCapacity,
          utilization: categoryCapacity > 0 ? ((categoryEnrollments / categoryCapacity) * 100).toFixed(1) : 0
        };
      }).sort((a, b) => b.enrollments - a.enrollments);

      setStats({
        totalActivities,
        totalEnrollments,
        totalCapacity,
        utilizationRate,
        activitiesByCategory,
        topActivities,
        categoryStats
      });
    } catch (err) {
      setError(err.message || 'Failed to fetch report data');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex items-center justify-center h-64">
          <div className="text-lg text-gray-600">Loading reports...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
          <p className="text-red-800 mb-4">Error: {error}</p>
          <button
            onClick={fetchReportData}
            className="bg-red-600 hover:bg-red-700 text-white font-semibold py-2 px-6 rounded-lg transition"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-gray-900 mb-2">System-Wide Reports</h2>
        <p className="text-gray-600">Analytics and insights for extra-curricular activities</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-gray-600">Total Activities</h3>
            <span className="text-2xl">🎯</span>
          </div>
          <p className="text-3xl font-bold text-gray-900">{stats.totalActivities}</p>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-gray-600">Total Enrollments</h3>
            <span className="text-2xl">👥</span>
          </div>
          <p className="text-3xl font-bold text-gray-900">{stats.totalEnrollments}</p>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-gray-600">Total Capacity</h3>
            <span className="text-2xl">📊</span>
          </div>
          <p className="text-3xl font-bold text-gray-900">{stats.totalCapacity}</p>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-gray-600">Utilization Rate</h3>
            <span className="text-2xl">📈</span>
          </div>
          <p className="text-3xl font-bold text-gray-900">{stats.utilizationRate}%</p>
        </div>
      </div>

      {/* Top Activities */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-8">
        <h3 className="text-xl font-bold text-gray-900 mb-4">Top 5 Activities by Enrollment</h3>
        {stats.topActivities.length > 0 ? (
          <div className="space-y-4">
            {stats.topActivities.map((activity, index) => {
              const percentage = activity.maxStudents > 0 
                ? ((activity.enrollments / activity.maxStudents) * 100).toFixed(0) 
                : 0;
              
              return (
                <div key={index} className="flex items-center gap-4">
                  <div className="flex-shrink-0 w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold">
                    {index + 1}
                  </div>
                  <div className="flex-1">
                    <div className="flex justify-between items-center mb-1">
                      <span className="font-semibold text-gray-900">{activity.name}</span>
                      <span className="text-sm text-gray-600">
                        {activity.enrollments} / {activity.maxStudents} ({percentage}%)
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-blue-600 h-2 rounded-full transition-all"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <p className="text-gray-600">No enrollment data available</p>
        )}
      </div>

      {/* Category Statistics */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-xl font-bold text-gray-900 mb-4">Statistics by Category</h3>
        {stats.categoryStats.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b-2 border-gray-200">
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">Category</th>
                  <th className="text-center py-3 px-4 font-semibold text-gray-700">Activities</th>
                  <th className="text-center py-3 px-4 font-semibold text-gray-700">Enrollments</th>
                  <th className="text-center py-3 px-4 font-semibold text-gray-700">Capacity</th>
                  <th className="text-center py-3 px-4 font-semibold text-gray-700">Utilization</th>
                </tr>
              </thead>
              <tbody>
                {stats.categoryStats.map((cat, index) => (
                  <tr key={index} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-3 px-4">
                      <span className="font-medium text-gray-900 capitalize">{cat.category}</span>
                    </td>
                    <td className="text-center py-3 px-4 text-gray-700">{cat.activities}</td>
                    <td className="text-center py-3 px-4 text-gray-700">{cat.enrollments}</td>
                    <td className="text-center py-3 px-4 text-gray-700">{cat.capacity}</td>
                    <td className="text-center py-3 px-4">
                      <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
                        cat.utilization >= 80 
                          ? 'bg-green-100 text-green-700' 
                          : cat.utilization >= 50 
                          ? 'bg-yellow-100 text-yellow-700' 
                          : 'bg-red-100 text-red-700'
                      }`}>
                        {cat.utilization}%
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-gray-600">No category data available</p>
        )}
      </div>

      {/* Refresh Button */}
      <div className="mt-8 flex justify-center">
        <button
          onClick={fetchReportData}
          className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-8 rounded-lg transition"
        >
          Refresh Data
        </button>
      </div>
    </div>
  );
};

export default Reports;
