/**
 * Attendance Page
 * 
 * Mark and view attendance for approved students
 */

import { useState, useEffect } from 'react';
import { getAllActivities, getActivityEnrollments, markAttendance, addPerformanceRemark } from '../../services/api';
import { useToast } from '../common/ToastContainer';

const AttendancePage = ({ coachName }) => {
  const [activities, setActivities] = useState([]);
  const [selectedActivity, setSelectedActivity] = useState(null);
  const [approvedStudents, setApprovedStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [attendanceDialog, setAttendanceDialog] = useState({ isOpen: false, student: null });
  const [attendanceData, setAttendanceData] = useState({ status: 'present', notes: '' });
  const [remarkDialog, setRemarkDialog] = useState({ isOpen: false, student: null });
  const [remarkText, setRemarkText] = useState('');
  const toast = useToast();

  useEffect(() => {
    fetchCoachActivities();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (selectedActivity) {
      fetchApprovedStudents(selectedActivity.id);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedActivity]);

  const fetchCoachActivities = async () => {
    try {
      setLoading(true);
      const response = await getAllActivities();
      const coachActivities = (response.data || []).filter(
        activity => activity.coach_name?.toLowerCase().includes(coachName.toLowerCase().split(' ')[0])
      );
      setActivities(coachActivities);
      if (coachActivities.length > 0) {
        setSelectedActivity(coachActivities[0]);
      }
    } catch {
      toast.error('Failed to load activities');
    } finally {
      setLoading(false);
    }
  };

  const fetchApprovedStudents = async (activityId) => {
    try {
      const response = await getActivityEnrollments(activityId);
      const approved = (response.data || []).filter(e => e.status === 'approved');
      setApprovedStudents(approved);
    } catch {
      toast.error('Failed to load students');
    }
  };

  const handleOpenAttendanceDialog = (student) => {
    setAttendanceDialog({ isOpen: true, student });
    setAttendanceData({ status: 'present', notes: '' });
  };

  const handleMarkAttendance = async () => {
    try {
      await markAttendance(
        attendanceDialog.student.enrollment_id,
        selectedActivity.id,
        attendanceData.status,
        attendanceData.notes
      );
      toast.success(`Marked ${attendanceDialog.student.student_id} as ${attendanceData.status}`);
      setAttendanceDialog({ isOpen: false, student: null });
      setAttendanceData({ status: 'present', notes: '' });
    } catch {
      toast.error('Failed to mark attendance');
    }
  };

  const handleOpenRemarkDialog = (student) => {
    setRemarkDialog({ isOpen: true, student });
    setRemarkText(student.performance_remarks || '');
  };

  const handleSaveRemark = async () => {
    if (!remarkText.trim()) {
      toast.warning('Please enter a remark');
      return;
    }

    try {
      await addPerformanceRemark(remarkDialog.student.enrollment_id, remarkText);
      toast.success('Performance remark saved');
      setRemarkDialog({ isOpen: false, student: null });
      setRemarkText('');
      fetchApprovedStudents(selectedActivity.id);
    } catch {
      toast.error('Failed to save remark');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg text-gray-600">Loading attendance...</div>
      </div>
    );
  }

  if (activities.length === 0) {
    return (
      <div className="bg-gray-50 rounded-lg p-12 text-center">
        <div className="w-16 h-16 mx-auto mb-4 bg-gray-200 rounded-full flex items-center justify-center">
          <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
        </div>
        <h3 className="text-2xl font-bold text-gray-900 mb-2">No Activities Assigned</h3>
        <p className="text-gray-600">You don't have any activities assigned to you yet.</p>
      </div>
    );
  }

  return (
    <div>
      {/* Activity Selector */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
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
              {activity.name} - {activity.schedule}
            </option>
          ))}
        </select>
      </div>

      {/* Activity Info */}
      {selectedActivity && (
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-6 mb-6 border border-blue-200">
          <h3 className="text-xl font-bold text-gray-900 mb-3">{selectedActivity.name}</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <p className="text-gray-600">Schedule</p>
              <p className="font-semibold text-gray-900">{selectedActivity.schedule}</p>
            </div>
            <div>
              <p className="text-gray-600">Venue</p>
              <p className="font-semibold text-gray-900">{selectedActivity.venue}</p>
            </div>
            <div>
              <p className="text-gray-600">Enrolled</p>
              <p className="font-semibold text-gray-900">{approvedStudents.length} students</p>
            </div>
            <div>
              <p className="text-gray-600">Today's Date</p>
              <p className="font-semibold text-gray-900">
                {new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Student List */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-xl font-bold text-gray-900 mb-4">
          Approved Students ({approvedStudents.length})
        </h3>

        {approvedStudents.length === 0 ? (
          <div className="text-center py-12 bg-gray-50 rounded-lg">
            <div className="w-16 h-16 mx-auto mb-4 bg-gray-200 rounded-full flex items-center justify-center">
              <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            <p className="text-gray-600 text-lg">No approved students yet</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {approvedStudents.map(student => (
              <div
                key={student.enrollment_id}
                className="border border-gray-200 rounded-lg p-6 hover:shadow-lg transition"
              >
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-400 to-indigo-500 rounded-full flex items-center justify-center">
                    <span className="text-xl font-bold text-white">
                      {student.student_id.toString().slice(-2)}
                    </span>
                  </div>
                  <div>
                    <p className="font-bold text-gray-900">Student {student.student_id}</p>
                    <p className="text-xs text-gray-600">
                      Enrolled {new Date(student.enrolled_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>

                {student.performance_remarks && (
                  <div className="mb-4 p-3 bg-purple-50 rounded-lg border border-purple-200">
                    <p className="text-xs font-semibold text-purple-900 mb-1">Last Remark:</p>
                    <p className="text-sm text-purple-800 line-clamp-2">
                      {student.performance_remarks}
                    </p>
                  </div>
                )}

                <div className="flex gap-2">
                  <button
                    onClick={() => handleOpenAttendanceDialog(student)}
                    className="flex-1 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium text-sm transition"
                  >
                    Mark
                  </button>
                  <button
                    onClick={() => handleOpenRemarkDialog(student)}
                    className="flex-1 px-3 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium text-sm transition"
                  >
                    Remark
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Attendance Dialog */}
      {attendanceDialog.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 animate-fade-in">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 animate-scale-in">
            <div className="p-6">
              <h3 className="text-xl font-bold text-gray-900 mb-4">
                Mark Attendance - Student {attendanceDialog.student.student_id}
              </h3>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">Status:</label>
                <select
                  value={attendanceData.status}
                  onChange={(e) => setAttendanceData({ ...attendanceData, status: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="present">✓ Present</option>
                  <option value="absent">✗ Absent</option>
                  <option value="late">⏰ Late</option>
                  <option value="excused">📋 Excused</option>
                </select>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">Notes (optional):</label>
                <textarea
                  value={attendanceData.notes}
                  onChange={(e) => setAttendanceData({ ...attendanceData, notes: e.target.value })}
                  placeholder="Add any notes about today's session..."
                  rows="3"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div className="flex gap-3 justify-end">
                <button
                  onClick={() => setAttendanceDialog({ isOpen: false, student: null })}
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

      {/* Remark Dialog */}
      {remarkDialog.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 animate-fade-in">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 animate-scale-in">
            <div className="p-6">
              <h3 className="text-xl font-bold text-gray-900 mb-4">
                Performance Remark - Student {remarkDialog.student.student_id}
              </h3>
              <textarea
                value={remarkText}
                onChange={(e) => setRemarkText(e.target.value)}
                placeholder="Enter performance feedback, strengths, areas for improvement..."
                rows="4"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent mb-4"
              />
              <div className="flex gap-3 justify-end">
                <button
                  onClick={() => setRemarkDialog({ isOpen: false, student: null })}
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
    </div>
  );
};

export default AttendancePage;
