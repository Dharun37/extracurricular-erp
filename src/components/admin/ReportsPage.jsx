/**
 * Reports Page
 * 
 * Generate and view activity participation and performance reports
 */

import { useState, useEffect } from 'react';
import { getAllActivities } from '../../services/api';
import { useToast } from '../common/ToastContainer';
import { FiUsers, FiDownload } from 'react-icons/fi';

const ReportsPage = () => {
  const [activities, setActivities] = useState([]);
  const [studentPerformance, setStudentPerformance] = useState([]);
  const [attendanceStats, setAttendanceStats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeReport, setActiveReport] = useState('participation');
  const toast = useToast();

  useEffect(() => {
    fetchReports();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const fetchReports = async () => {
    try {
      setLoading(true);
      
      // Fetch activities with enrollment counts
      const activitiesResponse = await getAllActivities();
      const activitiesData = activitiesResponse.data || [];
      setActivities(activitiesData);

      // Note: Student performance and attendance endpoints not yet implemented
      // These would be added when backend routes are created
      setStudentPerformance([]);
      setAttendanceStats([]);

    } catch {
      toast.error('Failed to load reports');
    } finally {
      setLoading(false);
    }
  };

  const calculateActivityStats = () => {
    return activities.map(activity => ({
      ...activity,
      enrolledCount: parseInt(activity.enrolled_count) || 0,
      maxStudents: parseInt(activity.max_students) || 1,
      fillRate: ((parseInt(activity.enrolled_count) || 0) / (parseInt(activity.max_students) || 1)) * 100
    })).sort((a, b) => b.enrolledCount - a.enrolledCount);
  };

  const calculateMostActiveStudents = () => {
    // Group enrollments by student
    const studentMap = new Map();
    
    studentPerformance.forEach(record => {
      if (!studentMap.has(record.student_id)) {
        studentMap.set(record.student_id, {
          studentId: record.student_id,
          enrollments: 0,
          activities: []
        });
      }
      const student = studentMap.get(record.student_id);
      student.enrollments++;
      student.activities.push(record.activity_name);
    });

    return Array.from(studentMap.values())
      .sort((a, b) => b.enrollments - a.enrollments)
      .slice(0, 10);
  };

  const calculateAttendancePercentage = () => {
    if (attendanceStats.length === 0) {
      return activities.map(activity => ({
        activityName: activity.name,
        totalSessions: 0,
        presentCount: 0,
        attendanceRate: 0,
        category: activity.category
      }));
    }

    return attendanceStats.map(stat => ({
      ...stat,
      attendanceRate: stat.total_sessions > 0 
        ? ((stat.present_count / stat.total_sessions) * 100).toFixed(1) 
        : 0
    }));
  };

  const exportToCSV = (data, filename) => {
    if (data.length === 0) {
      toast.warning('No data to export');
      return;
    }

    const headers = Object.keys(data[0]);
    const csvContent = [
      headers.join(','),
      ...data.map(row => headers.map(header => `"${row[header] || ''}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${filename}_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
    toast.success(`Exported ${filename}`);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg text-gray-600">Loading reports...</div>
      </div>
    );
  }

  const activityStats = calculateActivityStats();
  const mostActiveStudents = calculateMostActiveStudents();
  const attendanceData = calculateAttendancePercentage();

  const totalEnrollments = activities.reduce((sum, a) => sum + (parseInt(a.enrolled_count) || 0), 0);
  const totalCapacity = activities.reduce((sum, a) => sum + (parseInt(a.max_students) || 0), 0);
  const overallFillRate = totalCapacity > 0 ? ((totalEnrollments / totalCapacity) * 100).toFixed(1) : 0;

  return (
    <div>
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-6 border border-blue-200">
          <div className="text-3xl font-bold text-blue-700">{activities.length}</div>
          <div className="text-sm text-blue-600 font-medium mt-1">Total Activities</div>
        </div>
        <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg p-6 border border-green-200">
          <div className="text-3xl font-bold text-green-700">{totalEnrollments}</div>
          <div className="text-sm text-green-600 font-medium mt-1">Total Enrollments</div>
        </div>
        <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg p-6 border border-purple-200">
          <div className="text-3xl font-bold text-purple-700">{totalCapacity}</div>
          <div className="text-sm text-purple-600 font-medium mt-1">Total Capacity</div>
        </div>
        <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-lg p-6 border border-orange-200">
          <div className="text-3xl font-bold text-orange-700">{overallFillRate}%</div>
          <div className="text-sm text-orange-600 font-medium mt-1">Overall Fill Rate</div>
        </div>
      </div>

      {/* Report Tabs */}
      <div className="bg-white rounded-lg shadow-sm p-1.5 flex flex-wrap gap-1 mb-6 border border-gray-200">
        {[
          { key: 'participation', label: 'Participation Count' },
          { key: 'performance', label: 'Student Performance' },
          { key: 'active', label: 'Most Active Students' },
          { key: 'attendance', label: 'Attendance Stats' }
        ].map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveReport(tab.key)}
            className={`px-4 py-2.5 rounded-lg font-medium transition-all duration-200 ${
              activeReport === tab.key
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Activity Participation Count Report */}
      {activeReport === 'participation' && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-bold text-gray-900">Activity Participation Count</h3>
            <button
              onClick={() => exportToCSV(activityStats, 'activity_participation')}
              className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition"
            >
              <FiDownload className="text-lg" />
              Export CSV
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Rank</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Activity</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Category</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Coach</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Enrolled</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Capacity</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Fill Rate</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {activityStats.map((activity, index) => (
                  <tr key={activity.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center justify-center w-8 h-8 rounded-full text-sm font-bold ${
                        index === 0 ? 'bg-yellow-100 text-yellow-700' :
                        index === 1 ? 'bg-gray-100 text-gray-700' :
                        index === 2 ? 'bg-orange-100 text-orange-700' :
                        'bg-slate-50 text-slate-600'
                      }`}>
                        {index + 1}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">
                      {activity.name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="px-2 py-1 text-xs font-semibold text-blue-700 bg-blue-100 rounded-full">
                        {activity.category}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {activity.coach_name || 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {activity.enrolledCount}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {activity.maxStudents}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <div className="w-20 bg-gray-200 rounded-full h-2">
                          <div
                            className={`h-2 rounded-full ${
                              activity.fillRate >= 80 ? 'bg-green-600' : 
                              activity.fillRate >= 50 ? 'bg-yellow-600' : 'bg-red-600'
                            }`}
                            style={{ width: `${Math.min(activity.fillRate, 100)}%` }}
                          />
                        </div>
                        <span className="text-sm font-medium text-gray-700">
                          {activity.fillRate.toFixed(0)}%
                        </span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Student Performance Report */}
      {activeReport === 'performance' && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-bold text-gray-900">Student Performance Report</h3>
            <button
              onClick={() => exportToCSV(studentPerformance, 'student_performance')}
              className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition"
            >
              <FiDownload className="text-lg" />
              Export CSV
            </button>
          </div>
          {studentPerformance.length === 0 ? (
            <div className="text-center py-12 bg-gray-50 rounded-lg">
              <div className="w-16 h-16 mx-auto mb-4 bg-gray-200 rounded-full flex items-center justify-center">
                <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <p className="text-gray-600 text-lg">No performance data available yet</p>
              <p className="text-gray-500 text-sm mt-2">Coaches need to add performance remarks</p>
            </div>
          ) : (
            <div className="space-y-4">
              {studentPerformance.map((record, index) => (
                <div key={index} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <p className="font-bold text-gray-900">Student ID: {record.student_id}</p>
                      <p className="text-sm text-gray-600">{record.activity_name}</p>
                    </div>
                    <span className="px-3 py-1 text-xs font-semibold text-purple-700 bg-purple-100 rounded-full">
                      {record.status}
                    </span>
                  </div>
                  {record.performance_remarks && (
                    <div className="mt-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
                      <p className="text-sm text-blue-900">{record.performance_remarks}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Most Active Students Report */}
      {activeReport === 'active' && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-bold text-gray-900">Most Active Students (Top 10)</h3>
            <button
              onClick={() => exportToCSV(mostActiveStudents, 'most_active_students')}
              className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition"
            >
              <FiDownload className="text-lg" />
              Export CSV
            </button>
          </div>
          {mostActiveStudents.length === 0 ? (
            <div className="text-center py-12 bg-gray-50 rounded-lg">
              <div className="w-16 h-16 mx-auto mb-4 bg-gray-200 rounded-full flex items-center justify-center">
                <FiUsers className="text-2xl text-gray-400" />
              </div>
              <p className="text-gray-600 text-lg">No student enrollments yet</p>
            </div>
          ) : (
            <div className="space-y-3">
              {mostActiveStudents.map((student, index) => (
                <div
                  key={student.studentId}
                  className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:shadow-md transition"
                >
                  <div className="flex items-center gap-4">
                    <span className={`inline-flex items-center justify-center w-10 h-10 rounded-full text-sm font-bold ${
                      index === 0 ? 'bg-yellow-100 text-yellow-700' :
                      index === 1 ? 'bg-gray-100 text-gray-700' :
                      index === 2 ? 'bg-orange-100 text-orange-700' :
                      'bg-slate-50 text-slate-600'
                    }`}>
                      {index + 1}
                    </span>
                    <div>
                      <p className="font-bold text-gray-900">Student {student.studentId}</p>
                      <p className="text-sm text-gray-600">
                        {student.activities.slice(0, 3).join(', ')}
                        {student.activities.length > 3 && ` +${student.activities.length - 3} more`}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-indigo-600">{student.enrollments}</div>
                    <div className="text-xs text-gray-600">activities</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Attendance Percentage Report */}
      {activeReport === 'attendance' && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-bold text-gray-900">Attendance Statistics</h3>
            <button
              onClick={() => exportToCSV(attendanceData, 'attendance_stats')}
              className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition"
            >
              <FiDownload className="text-lg" />
              Export CSV
            </button>
          </div>
          {attendanceData.length === 0 ? (
            <div className="text-center py-12 bg-gray-50 rounded-lg">
              <div className="w-16 h-16 mx-auto mb-4 bg-gray-200 rounded-full flex items-center justify-center">
                <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                </svg>
              </div>
              <p className="text-gray-600 text-lg">No attendance records yet</p>
              <p className="text-gray-500 text-sm mt-2">Coaches need to mark attendance</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Activity</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Category</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total Sessions</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Present</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Attendance Rate</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {attendanceData.map((stat, index) => (
                    <tr key={index} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">
                        {stat.activityName || stat.activity_name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="px-2 py-1 text-xs font-semibold text-blue-700 bg-blue-100 rounded-full">
                          {stat.category}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        {stat.totalSessions || stat.total_sessions || 0}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        {stat.presentCount || stat.present_count || 0}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <div className="w-24 bg-gray-200 rounded-full h-2">
                            <div
                              className={`h-2 rounded-full ${
                                stat.attendanceRate >= 80 ? 'bg-green-600' : 
                                stat.attendanceRate >= 60 ? 'bg-yellow-600' : 'bg-red-600'
                              }`}
                              style={{ width: `${Math.min(stat.attendanceRate, 100)}%` }}
                            />
                          </div>
                          <span className="text-sm font-medium text-gray-700">
                            {stat.attendanceRate}%
                          </span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ReportsPage;
