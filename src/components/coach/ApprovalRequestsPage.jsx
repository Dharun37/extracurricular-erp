/**
 * Approval Requests Page
 * 
 * Coach can approve or reject student enrollment requests
 */

import { useState, useEffect } from 'react';
import { getAllActivities, getActivityEnrollments, updateEnrollmentStatus } from '../../services/api';
import { useToast } from '../common/ToastContainer';

const ApprovalRequestsPage = ({ coachName }) => {
  const [activities, setActivities] = useState([]);
  const [selectedActivity, setSelectedActivity] = useState(null);
  const [pendingRequests, setPendingRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(null);
  const toast = useToast();

  useEffect(() => {
    fetchCoachActivities();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (selectedActivity) {
      fetchPendingRequests(selectedActivity.id);
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

  const fetchPendingRequests = async (activityId) => {
    try {
      const response = await getActivityEnrollments(activityId);
      const pending = (response.data || []).filter(e => e.status === 'active');
      setPendingRequests(pending);
    } catch {
      toast.error('Failed to load pending requests');
    }
  };

  const handleApprove = async (enrollmentId, studentId) => {
    try {
      setProcessing(enrollmentId);
      await updateEnrollmentStatus(enrollmentId, 'approved');
      toast.success(`Approved student ${studentId}`);
      fetchPendingRequests(selectedActivity.id);
    } catch {
      toast.error('Failed to approve');
    } finally {
      setProcessing(null);
    }
  };

  const handleReject = async (enrollmentId, studentId) => {
    try {
      setProcessing(enrollmentId);
      await updateEnrollmentStatus(enrollmentId, 'rejected');
      toast.success(`Rejected student ${studentId}`);
      fetchPendingRequests(selectedActivity.id);
    } catch {
      toast.error('Failed to reject');
    } finally {
      setProcessing(null);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg text-gray-600">Loading approval requests...</div>
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
              {activity.name} ({activity.category})
            </option>
          ))}
        </select>
      </div>

      {/* Statistics */}
      {selectedActivity && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-yellow-50 rounded-lg p-6 border border-yellow-200">
            <div className="text-3xl font-bold text-yellow-700">{pendingRequests.length}</div>
            <div className="text-sm text-yellow-600 font-medium mt-1">Pending Requests</div>
          </div>
          <div className="bg-blue-50 rounded-lg p-6 border border-blue-200">
            <div className="text-3xl font-bold text-blue-700">{selectedActivity.enrolled_count || 0}</div>
            <div className="text-sm text-blue-600 font-medium mt-1">Total Enrolled</div>
          </div>
          <div className="bg-gray-50 rounded-lg p-6 border border-gray-200">
            <div className="text-3xl font-bold text-gray-700">{selectedActivity.max_students}</div>
            <div className="text-sm text-gray-600 font-medium mt-1">Max Capacity</div>
          </div>
        </div>
      )}

      {/* Pending Requests */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-xl font-bold text-gray-900 mb-4">
          Pending Approval Requests ({pendingRequests.length})
        </h3>

        {pendingRequests.length === 0 ? (
          <div className="text-center py-12 bg-gray-50 rounded-lg">
            <div className="w-16 h-16 mx-auto mb-4 bg-green-100 rounded-full flex items-center justify-center">
              <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <p className="text-gray-600 text-lg">No pending requests. All caught up!</p>
          </div>
        ) : (
          <div className="space-y-4">
            {pendingRequests.map(request => (
              <div
                key={request.enrollment_id}
                className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                        <span className="text-xl font-bold text-blue-600">
                          {request.student_id.toString().slice(-2)}
                        </span>
                      </div>
                      <div>
                        <p className="text-lg font-bold text-gray-900">Student ID: {request.student_id}</p>
                        <p className="text-sm text-gray-600">
                          Requested on {formatDate(request.enrolled_at)}
                        </p>
                      </div>
                    </div>
                    {request.notes && (
                      <div className="mt-3 p-3 bg-blue-50 rounded-lg">
                        <p className="text-xs font-semibold text-blue-900 mb-1">Student's Message:</p>
                        <p className="text-sm text-blue-800">{request.notes}</p>
                      </div>
                    )}
                  </div>
                  <div className="flex gap-2 ml-4">
                    <button
                      onClick={() => handleApprove(request.enrollment_id, request.student_id)}
                      disabled={processing === request.enrollment_id}
                      className="px-6 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition disabled:bg-green-400"
                    >
                      {processing === request.enrollment_id ? '...' : 'Approve'}
                    </button>
                    <button
                      onClick={() => handleReject(request.enrollment_id, request.student_id)}
                      disabled={processing === request.enrollment_id}
                      className="px-6 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition disabled:bg-red-400"
                    >
                      {processing === request.enrollment_id ? '...' : 'Reject'}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ApprovalRequestsPage;
