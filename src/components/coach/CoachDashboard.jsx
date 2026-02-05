/**
 * Coach Dashboard Component
 * 
 * Allows coaches to:
 * - View assigned activities
 * - Approve/reject student registrations
 * - Mark attendance
 * - Add performance remarks
 */

import { useState, useEffect } from 'react';
import { getAllActivities, getActivityEnrollments, updateEnrollmentStatus, addPerformanceRemark, markAttendance } from '../../services/api';
import { useToast } from '../common/ToastContainer';
import ConfirmDialog from '../common/ConfirmDialog';

const CoachDashboard = ({ coachName = 'Teacher User' }) => {
  const [activities, setActivities] = useState([]);
  const [selectedActivity, setSelectedActivity] = useState(null);
  const [enrollments, setEnrollments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('activities');
  const [remarkDialog, setRemarkDialog] = useState({ isOpen: false, enrollmentId: null });
  const [remarkText, setRemarkText] = useState('');
  const [attendanceDialog, setAttendanceDialog] = useState({ isOpen: false, enrollmentId: null });
  const [attendanceData, setAttendanceData] = useState({ status: 'present', notes: '' });
  const toast = useToast();

  useEffect(() => {
    fetchCoachActivities();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [coachName]);

  useEffect(() => {
    if (selectedActivity) {
      fetchEnrollments(selectedActivity.id);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedActivity]);

  const fetchCoachActivities = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await getAllActivities();
      // Filter activities assigned to this coach - match by name (case-insensitive)
      const searchName = coachName.toLowerCase().trim();
      const coachActivities = (response.data || []).filter(activity => {
        const activityCoach = activity.coach_name?.toLowerCase() || '';
        // Match by full name (check if the coach field contains the full name)
        // Also handle "Coach John Smith" matching "John Smith"
        const nameParts = searchName.split(' ');
        const firstName = nameParts[0];
        const lastName = nameParts.length > 1 ? nameParts[nameParts.length - 1] : '';
        
        // Must match full name or first+last name pattern
        return activityCoach.includes(searchName) || 
               (lastName && activityCoach.includes(firstName) && activityCoach.includes(lastName));
      });
      setActivities(coachActivities);
      if (coachActivities.length > 0) {
        setSelectedActivity(coachActivities[0]);
      } else {
        setSelectedActivity(null);
        setEnrollments([]);
      }
    } catch (err) {
      setError(err.message || 'Failed to fetch activities');
      toast.error('Failed to load activities');
    } finally {
      setLoading(false);
    }
  };

  const fetchEnrollments = async (activityId) => {
    try {
      const response = await getActivityEnrollments(activityId);
      setEnrollments(response.data || []);
    } catch {
      toast.error('Failed to load enrollments');
    }
  };

  const handleApprove = async (enrollmentId) => {
    try {
      await updateEnrollmentStatus(enrollmentId, 'approved');
      toast.success('Registration approved');
      fetchEnrollments(selectedActivity.id);
    } catch {
      toast.error('Failed to approve registration');
    }
  };

  const handleReject = async (enrollmentId) => {
    try {
      await updateEnrollmentStatus(enrollmentId, 'rejected');
      toast.success('Registration rejected');
      fetchEnrollments(selectedActivity.id);
    } catch {
      toast.error('Failed to reject registration');
    }
  };

  const handleOpenRemarkDialog = (enrollmentId) => {
    setRemarkDialog({ isOpen: true, enrollmentId });
    setRemarkText('');
  };

  const handleSaveRemark = async () => {
    if (!remarkText.trim()) {
      toast.warning('Please enter a remark');
      return;
    }

    try {
      await addPerformanceRemark(remarkDialog.enrollmentId, remarkText);
      toast.success('Performance remark added');
      setRemarkDialog({ isOpen: false, enrollmentId: null });
      setRemarkText('');
      fetchEnrollments(selectedActivity.id);
    } catch {
      toast.error('Failed to add remark');
    }
  };

  const handleOpenAttendanceDialog = (enrollmentId) => {
    setAttendanceDialog({ isOpen: true, enrollmentId });
    setAttendanceData({ status: 'present', notes: '' });
  };

  const handleMarkAttendance = async () => {
    try {
      await markAttendance(
        attendanceDialog.enrollmentId,
        selectedActivity.id,
        attendanceData.status,
        attendanceData.notes
      );
      toast.success(`Marked as ${attendanceData.status}`);
      setAttendanceDialog({ isOpen: false, enrollmentId: null });
      setAttendanceData({ status: 'present', notes: '' });
    } catch {
      toast.error('Failed to mark attendance');
    }
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex items-center justify-center h-64">
          <div className="text-lg text-gray-600">Loading coach dashboard...</div>
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
            onClick={fetchCoachActivities}
            className="bg-red-600 hover:bg-red-700 text-white font-semibold py-2 px-6 rounded-lg transition"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (activities.length === 0) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="bg-gray-50 rounded-lg p-12 text-center">
          <div className="w-16 h-16 mx-auto mb-4 bg-gray-200 rounded-full flex items-center justify-center">
            <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
          </div>
          <h3 className="text-2xl font-bold text-gray-900 mb-2">No Activities Assigned</h3>
          <p className="text-gray-600">You don't have any activities assigned to you yet.</p>
        </div>
      </div>
    );
  }

  const pendingEnrollments = enrollments.filter(e => e.status === 'active');
  const approvedEnrollments = enrollments.filter(e => e.status === 'approved');

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-gray-900 mb-2">Coach Dashboard</h2>
        <p className="text-gray-600">Manage your activities and students</p>
      </div>

      {/* Activity Selection */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">Select Activity:</label>
        <select
          value={selectedActivity?.id || ''}
          onChange={(e) => {
            const activity = activities.find(a => a.id === parseInt(e.target.value));
            setSelectedActivity(activity);
          }}
          className="w-full max-w-md px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          {activities.map(activity => (
            <option key={activity.id} value={activity.id}>
              {activity.name} ({activity.category})
            </option>
          ))}
        </select>
      </div>

      {selectedActivity && (
        <>
          {/* Activity Info Card */}
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <h3 className="text-xl font-bold text-gray-900 mb-4">{selectedActivity.name}</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <p className="text-sm text-gray-600">Category</p>
                <p className="font-semibold text-gray-900 capitalize">{selectedActivity.category}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Schedule</p>
                <p className="font-semibold text-gray-900">{selectedActivity.schedule}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Venue</p>
                <p className="font-semibold text-gray-900">{selectedActivity.venue}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Max Students</p>
                <p className="font-semibold text-gray-900">{selectedActivity.max_students}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Enrolled</p>
                <p className="font-semibold text-gray-900">{selectedActivity.enrolled_count || 0}</p>
              </div>
            </div>
          </div>

          {/* Tabs */}
          <div className="bg-white rounded-xl shadow-sm p-1.5 flex gap-1 mb-6 border border-gray-200">
            <button
              className={`flex-1 px-6 py-3 font-medium rounded-lg transition-all duration-200 ${
                activeTab === 'activities'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              }`}
              onClick={() => setActiveTab('activities')}
            >
              Pending Approvals ({pendingEnrollments.length})
            </button>
            <button
              className={`flex-1 px-6 py-3 font-medium rounded-lg transition-all duration-200 ${
                activeTab === 'approved'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              }`}
              onClick={() => setActiveTab('approved')}
            >
              Approved Students ({approvedEnrollments.length})
            </button>
            <button
              className={`flex-1 px-6 py-3 font-medium rounded-lg transition-all duration-200 ${
                activeTab === 'attendance'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              }`}
              onClick={() => setActiveTab('attendance')}
            >
              Attendance
            </button>
          </div>

          {/* Pending Approvals Tab */}
          {activeTab === 'activities' && (
            <div>
              <h3 className="text-xl font-bold text-gray-900 mb-4">Pending Student Registrations</h3>
              {pendingEnrollments.length === 0 ? (
                <div className="bg-gray-50 rounded-lg p-8 text-center">
                  <p className="text-gray-600">No pending registrations</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {pendingEnrollments.map(enrollment => (
                    <div key={enrollment.enrollment_id} className="bg-white rounded-lg shadow-md border border-gray-200 p-6">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <p className="text-lg font-semibold text-gray-900">Student ID: {enrollment.student_id}</p>
                          <p className="text-sm text-gray-600 mt-1">
                            Enrolled on: {new Date(enrollment.enrolled_at).toLocaleDateString()}
                          </p>
                          {enrollment.notes && (
                            <p className="text-sm text-gray-700 mt-2">
                              <strong>Notes:</strong> {enrollment.notes}
                            </p>
                          )}
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleApprove(enrollment.enrollment_id)}
                            className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-semibold transition"
                          >
                            Approve
                          </button>
                          <button
                            onClick={() => handleReject(enrollment.enrollment_id)}
                            className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-semibold transition"
                          >
                            Reject
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Approved Students Tab */}
          {activeTab === 'approved' && (
            <div>
              <h3 className="text-xl font-bold text-gray-900 mb-4">Approved Students</h3>
              {approvedEnrollments.length === 0 ? (
                <div className="bg-gray-50 rounded-lg p-8 text-center">
                  <p className="text-gray-600">No approved students yet</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {approvedEnrollments.map(enrollment => (
                    <div key={enrollment.enrollment_id} className="bg-white rounded-lg shadow-md border border-gray-200 p-6">
                      <div className="flex items-start justify-between mb-4">
                        <div>
                          <p className="text-lg font-semibold text-gray-900">Student ID: {enrollment.student_id}</p>
                          <p className="text-sm text-gray-600 mt-1">
                            Enrolled: {new Date(enrollment.enrolled_at).toLocaleDateString()}
                          </p>
                        </div>
                        <span className="px-3 py-1 text-xs font-semibold text-green-700 bg-green-100 rounded-full">
                          Approved
                        </span>
                      </div>
                      {enrollment.performance_remarks && (
                        <div className="mb-4 p-3 bg-blue-50 rounded-lg">
                          <p className="text-sm font-semibold text-blue-900">Performance Remarks:</p>
                          <p className="text-sm text-blue-800 mt-1">{enrollment.performance_remarks}</p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Attendance Tab */}
          {activeTab === 'attendance' && (
            <div>
              <h3 className="text-xl font-bold text-gray-900 mb-4">Mark Attendance</h3>
              <p className="text-gray-600 mb-6">Mark attendance and add performance remarks for approved students</p>
              
              {approvedEnrollments.length === 0 ? (
                <div className="bg-gray-50 rounded-lg p-8 text-center">
                  <div className="w-16 h-16 mx-auto mb-4 bg-gray-200 rounded-full flex items-center justify-center">
                    <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                    </svg>
                  </div>
                  <p className="text-gray-600">No approved students to mark attendance for</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {approvedEnrollments.map(enrollment => (
                    <div key={enrollment.enrollment_id} className="bg-white rounded-lg shadow-md border border-gray-200 p-6">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <p className="text-lg font-semibold text-gray-900 mb-2">Student ID: {enrollment.student_id}</p>
                          <div className="grid grid-cols-2 gap-4 text-sm">
                            <div>
                              <p className="text-gray-600">Enrolled Date:</p>
                              <p className="font-medium text-gray-900">
                                {new Date(enrollment.enrolled_at).toLocaleDateString()}
                              </p>
                            </div>
                            {enrollment.status && (
                              <div>
                                <p className="text-gray-600">Status:</p>
                                <span className="inline-block px-2 py-1 text-xs font-semibold text-green-700 bg-green-100 rounded">
                                  {enrollment.status}
                                </span>
                              </div>
                            )}
                          </div>
                          
                          {enrollment.performance_remarks && (
                            <div className="mt-4 p-3 bg-purple-50 rounded-lg border border-purple-100">
                              <p className="text-sm font-semibold text-purple-900 mb-1">📝 Latest Remarks:</p>
                              <p className="text-sm text-purple-800">{enrollment.performance_remarks}</p>
                            </div>
                          )}
                        </div>
                        
                        <div className="flex flex-col gap-2 ml-4">
                          <button
                            onClick={() => handleOpenAttendanceDialog(enrollment.enrollment_id)}
                            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold text-sm transition whitespace-nowrap"
                          >
                            ✓ Mark Attendance
                          </button>
                          <button
                            onClick={() => handleOpenRemarkDialog(enrollment.enrollment_id)}
                            className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-semibold text-sm transition whitespace-nowrap"
                          >
                            📝 Add Remark
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </>
      )}

      {/* Performance Remark Dialog */}
      {remarkDialog.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 animate-fade-in">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 animate-scale-in">
            <div className="p-6">
              <h3 className="text-xl font-bold text-gray-900 mb-4">Add Performance Remark</h3>
              <textarea
                value={remarkText}
                onChange={(e) => setRemarkText(e.target.value)}
                placeholder="Enter performance remarks..."
                rows="4"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent mb-4"
              />
              <div className="flex gap-3 justify-end">
                <button
                  onClick={() => setRemarkDialog({ isOpen: false, enrollmentId: null })}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors font-medium"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveRemark}
                  className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors font-medium"
                >
                  Save Remark
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Attendance Dialog */}
      {attendanceDialog.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 animate-fade-in">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 animate-scale-in">
            <div className="p-6">
              <h3 className="text-xl font-bold text-gray-900 mb-4">Mark Attendance</h3>
              
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">Status:</label>
                <select
                  value={attendanceData.status}
                  onChange={(e) => setAttendanceData({ ...attendanceData, status: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="present">Present</option>
                  <option value="absent">Absent</option>
                  <option value="late">Late</option>
                  <option value="excused">Excused</option>
                </select>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">Notes (optional):</label>
                <textarea
                  value={attendanceData.notes}
                  onChange={(e) => setAttendanceData({ ...attendanceData, notes: e.target.value })}
                  placeholder="Add any notes..."
                  rows="3"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div className="flex gap-3 justify-end">
                <button
                  onClick={() => setAttendanceDialog({ isOpen: false, enrollmentId: null })}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors font-medium"
                >
                  Cancel
                </button>
                <button
                  onClick={handleMarkAttendance}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors font-medium"
                >
                  Save Attendance
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CoachDashboard;
